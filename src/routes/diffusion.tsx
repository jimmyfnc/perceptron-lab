import { createFileRoute } from "@tanstack/react-router";
import { stationByPath } from "@/lib/journey";
import { StationStub } from "@/components/site/StationStub";

export const Route = createFileRoute("/diffusion")({
  head: () => ({
    meta: [
      { title: "Diffusion — The Denoising Deck | Perceptron Lab" },
      {
        name: "description",
        content:
          "Latent space, the denoising loop, VAEs, CFG, and LoRA — scrub from pure noise to an image, one step at a time.",
      },
    ],
  }),
  component: () => <StationStub station={stationByPath("/diffusion")!} />,
});
