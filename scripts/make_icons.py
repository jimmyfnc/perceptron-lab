"""
Rasterize the Perceptron Lab favicon (same design as public/favicon.svg)
to favicon.ico (16/32/48) and apple-touch-icon.png (180) with Pillow.

    D:/GitHub/ComfyUI/venv/Scripts/python.exe scripts/make_icons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

S = 512  # master size, downscaled for anti-aliasing
PUB = Path(__file__).resolve().parents[1] / "public"

BG = (21, 22, 28, 255)  # graphite
INK = (232, 227, 212)  # warm ivory
BLUE = (125, 158, 255)  # neuron accent (station 02 hue)


def rounded_rect_mask(size: int, radius: int) -> Image.Image:
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return m


def draw_mark(s: int, corner_ticks: bool = True) -> Image.Image:
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    u = s / 64  # svg-unit scale

    d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(12 * u), fill=BG)

    def line(x1, y1, x2, y2, color, w):
        d.line([x1 * u, y1 * u, x2 * u, y2 * u], fill=color, width=max(1, int(w * u)))

    def dot(cx, cy, r, color):
        d.ellipse([(cx - r) * u, (cy - r) * u, (cx + r) * u, (cy + r) * u], fill=color)

    if corner_ticks:
        tick = (*INK, 90)
        line(10, 16, 10, 10, tick, 2)
        line(10, 10, 16, 10, tick, 2)
        line(54, 48, 54, 54, tick, 2)
        line(54, 54, 48, 54, tick, 2)

    edge = (*INK, 140)
    line(18, 17, 41, 30, edge, 2.5)
    line(18, 32, 41, 32, edge, 2.5)
    line(18, 47, 41, 34, edge, 2.5)

    node = (*INK, 205)
    for cy in (17, 32, 47):
        dot(16, cy, 4, node)

    # neuron halo + core
    halo_r = 12.5
    dw = max(1, int(2 * u))
    d.ellipse(
        [(45 - halo_r) * u, (32 - halo_r) * u, (45 + halo_r) * u, (32 + halo_r) * u],
        outline=(*BLUE, 90),
        width=dw,
    )
    dot(45, 32, 8.5, (*BLUE, 255))
    return img


def main() -> None:
    master = draw_mark(S)

    # apple-touch-icon: opaque, no transparency, slightly tighter radius look
    apple = master.resize((180, 180), Image.LANCZOS)
    flat = Image.new("RGB", apple.size, BG[:3])
    flat.paste(apple, mask=apple.split()[3])
    flat.save(PUB / "apple-touch-icon.png")

    # ico: drop the corner ticks at tiny sizes — they read as noise
    small_master = draw_mark(S, corner_ticks=False)
    sizes = [16, 32, 48]
    frames = [small_master.resize((n, n), Image.LANCZOS) for n in sizes]
    frames[0].save(
        PUB / "favicon.ico",
        format="ICO",
        sizes=[(n, n) for n in sizes],
        append_images=frames[1:],
    )

    for f in ("favicon.ico", "apple-touch-icon.png"):
        print(f, (PUB / f).stat().st_size, "bytes")


if __name__ == "__main__":
    main()
