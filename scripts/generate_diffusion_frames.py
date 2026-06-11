"""
Generate the Denoising Deck's assets with a real Stable Diffusion 1.5 run,
using the checkpoint already in ComfyUI. diffusers lives in an isolated
--target dir so the ComfyUI venv is untouched:

    PYTHONPATH=C:/Users/caldw/AppData/Local/Temp/diffusers-pkg \
      D:/GitHub/ComfyUI/venv/Scripts/python.exe scripts/generate_diffusion_frames.py

Outputs (public/data/diffusion/):
  seed{k}/step{i}.webp    decoded image at each of the 21 sampling states (256px)
  seed{k}/latent{i}.png   the raw 64x64 latent at the same state (3 of 4 channels as RGB)
  seed{k}/guess{i}.webp   the model's running prediction of the FINISHED image (x̂0),
                          recovered exactly from consecutive DDIM states
  cfg/cfg{g}.webp         final image at guidance scale g, same seed/noise
  walk/{i}.webp           finals along a slerp between two seeds' starting noise
  manifest.json
"""

import json
from pathlib import Path

import torch
from diffusers import DDIMScheduler, StableDiffusionPipeline
from huggingface_hub import snapshot_download

CKPT = "D:/GitHub/ComfyUI/models/checkpoints/v1-5-pruned-emaonly-fp16.safetensors"
OUT = Path(__file__).resolve().parents[1] / "public" / "data" / "diffusion"
# plain-files config download (the default HF cache wants symlinks Windows won't grant)
CONFIG_DIR = Path("C:/Users/caldw/AppData/Local/Temp/sd15-config")

PROMPT = (
    "a lighthouse on a rocky cliff at dusk, dramatic golden clouds, crashing waves, "
    "oil painting, warm light, highly detailed"
)
NEGATIVE = "blurry, low quality, watermark, text, frame, signature"
STEPS = 20
SEEDS = [7, 21, 42]
CFGS = [1.0, 4.0, 7.5, 12.0]
WALK_N = 9  # frames along the noise slerp (inclusive endpoints)
SIZE = 256  # shipped image edge


def save_pixel(img, path: Path) -> None:
    img.resize((SIZE, SIZE)).save(path, "WEBP", quality=80)


def save_latent(lat: torch.Tensor, path: Path) -> None:
    """[4,64,64] latent -> RGB png from the first three channels."""
    from PIL import Image
    import numpy as np

    x = lat[:3].float().cpu().numpy()
    x = np.clip(x / 3.0 + 0.5, 0, 1)  # latents are roughly N(0, ~1.2)
    arr = (x.transpose(1, 2, 0) * 255).astype("uint8")
    Image.fromarray(arr).save(path, "PNG")


def slerp(a: torch.Tensor, b: torch.Tensor, t: float) -> torch.Tensor:
    af, bf = a.flatten(), b.flatten()
    omega = torch.acos(
        torch.clamp(torch.dot(af / af.norm(), bf / bf.norm()), -1, 1)
    )
    if omega.abs() < 1e-4:
        return a * (1 - t) + b * t
    return (torch.sin((1 - t) * omega) * a + torch.sin(t * omega) * b) / torch.sin(omega)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    if not (CONFIG_DIR / "model_index.json").exists():
        snapshot_download(
            "stable-diffusion-v1-5/stable-diffusion-v1-5",
            allow_patterns=["**/*.json", "**/*.txt", "*.json"],
            local_dir=str(CONFIG_DIR),
        )
    pipe = StableDiffusionPipeline.from_single_file(
        CKPT,
        config=str(CONFIG_DIR),
        local_files_only=False,
        torch_dtype=torch.float16,
        safety_checker=None,
        requires_safety_checker=False,
    )
    pipe.scheduler = DDIMScheduler.from_config(pipe.scheduler.config)
    pipe.to("cuda")
    pipe.set_progress_bar_config(disable=True)

    def decode(lat: torch.Tensor):
        with torch.no_grad():
            img = pipe.vae.decode(lat.unsqueeze(0) / pipe.vae.config.scaling_factor).sample[0]
        img = (img / 2 + 0.5).clamp(0, 1).float().cpu()
        from PIL import Image
        import numpy as np

        return Image.fromarray((img.numpy().transpose(1, 2, 0) * 255).astype("uint8"))

    def init_noise(seed: int) -> torch.Tensor:
        g = torch.Generator("cuda").manual_seed(seed)
        return torch.randn((1, 4, 64, 64), generator=g, device="cuda", dtype=torch.float16)

    def run(noise: torch.Tensor, cfg: float, capture=None):
        """One full sampling run from a fixed starting noise."""
        if capture is not None:
            capture(0, noise[0] * pipe.scheduler.init_noise_sigma)

        def cb(p, step, timestep, kw):
            if capture is not None:
                capture(step + 1, kw["latents"][0])
            return kw

        with torch.no_grad():
            out = pipe(
                PROMPT,
                negative_prompt=NEGATIVE,
                num_inference_steps=STEPS,
                guidance_scale=cfg,
                latents=noise,
                callback_on_step_end=cb,
                output_type="pil",
            )
        return out.images[0]

    # --- per-step stacks for each seed ---
    for k, seed in enumerate(SEEDS):
        d = OUT / f"seed{k}"
        d.mkdir(exist_ok=True)
        lats: list[torch.Tensor] = []

        def capture(i: int, lat: torch.Tensor, d=d, lats=lats):
            lats.append(lat.detach().float().clone())
            save_pixel(decode(lat), d / f"step{i}.webp")
            save_latent(lat, d / f"latent{i}.png")

        run(init_noise(seed), 7.5, capture)

        # Recover the model's x̂0 prediction from consecutive DDIM (eta=0) states:
        #   x_t     = √ᾱ_t·x̂0 + √(1−ᾱ_t)·ε̂
        #   x_{t−1} = √ᾱ_{t−1}·x̂0 + √(1−ᾱ_{t−1})·ε̂
        # — two equations, two unknowns, solved per element.
        abars = pipe.scheduler.alphas_cumprod.float()
        ts = pipe.scheduler.timesteps.tolist()
        for i in range(1, len(lats)):
            t = ts[i - 1]
            ab_t = abars[t]
            ab_p = abars[ts[i]] if i < len(ts) else pipe.scheduler.final_alpha_cumprod.float()
            a_t, b_t = ab_t.sqrt(), (1 - ab_t).sqrt()
            a_p, b_p = ab_p.sqrt(), (1 - ab_p).sqrt()
            x0 = (b_p * lats[i - 1] - b_t * lats[i]) / (a_t * b_p - a_p * b_t)
            save_pixel(decode(x0.to(torch.float16).cuda()), d / f"guess{i}.webp")
        # state 0: the model hasn't looked yet — its "guess" is just the noise
        save_pixel(decode(lats[0].to(torch.float16).cuda()), d / "guess0.webp")
        print(f"seed{k} (={seed}): {STEPS + 1} states + x0 predictions")

    # --- CFG strip (same noise as seed0) ---
    d = OUT / "cfg"
    d.mkdir(exist_ok=True)
    for g in CFGS:
        save_pixel(run(init_noise(SEEDS[0]), g), d / f"cfg{g:g}.webp")
        print(f"cfg {g:g}")

    # --- latent walk between seed0 and seed1 noise ---
    d = OUT / "walk"
    d.mkdir(exist_ok=True)
    n0, n1 = init_noise(SEEDS[0]), init_noise(SEEDS[1])
    for i in range(WALK_N):
        t = i / (WALK_N - 1)
        save_pixel(run(slerp(n0, n1, t).to(torch.float16), 7.5), d / f"{i}.webp")
        print(f"walk {i}/{WALK_N - 1}")

    manifest = {
        "model": "sd-1.5 (v1-5-pruned-emaonly-fp16)",
        "prompt": PROMPT,
        "steps": STEPS + 1,
        "seeds": len(SEEDS),
        "cfgs": CFGS,
        "walk": WALK_N,
        "size": SIZE,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    total = sum(f.stat().st_size for f in OUT.rglob("*") if f.is_file())
    print(f"done — {total / 1024:.0f} KB in {OUT}")


if __name__ == "__main__":
    main()
