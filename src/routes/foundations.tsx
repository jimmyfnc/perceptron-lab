import { createFileRoute } from "@tanstack/react-router";
import { stationByPath } from "@/lib/journey";
import { StationStub } from "@/components/site/StationStub";

export const Route = createFileRoute("/foundations")({
  head: () => ({
    meta: [
      { title: "Classical ML — The Boundary Lab | Visionary Labs" },
      {
        name: "description",
        content:
          "Bias, variance, overfitting, KNN, k-means, and gradient descent — taught through a draggable decision-boundary playground.",
      },
    ],
  }),
  component: () => <StationStub station={stationByPath("/foundations")!} />,
});
