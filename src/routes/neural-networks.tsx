import { createFileRoute } from "@tanstack/react-router";
import { stationByPath } from "@/lib/journey";
import { StationStub } from "@/components/site/StationStub";

export const Route = createFileRoute("/neural-networks")({
  head: () => ({
    meta: [
      { title: "Neural Networks — The Descent | Visionary Labs" },
      {
        name: "description",
        content:
          "Perceptron to MLP, backprop, activations, and loss landscapes — with optimizers racing down a 3D loss surface.",
      },
    ],
  }),
  component: () => <StationStub station={stationByPath("/neural-networks")!} />,
});
