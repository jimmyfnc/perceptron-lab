import { createFileRoute } from "@tanstack/react-router";
import { stationByPath } from "@/lib/journey";
import { pageHead } from "@/lib/site";
import { StationStub } from "@/components/site/StationStub";

export const Route = createFileRoute("/diffusion")({
  head: () =>
    pageHead(
      "/diffusion",
      "Diffusion — The Denoising Deck | Perceptron Lab",
      "Latent space, the denoising loop, VAEs, CFG, and LoRA — scrub from pure noise to an image, one step at a time.",
    ),
  component: () => <StationStub station={stationByPath("/diffusion")!} />,
});
