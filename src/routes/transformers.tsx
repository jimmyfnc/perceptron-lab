import { createFileRoute } from "@tanstack/react-router";
import { stationByPath } from "@/lib/journey";
import { StationStub } from "@/components/site/StationStub";

export const Route = createFileRoute("/transformers")({
  head: () => ({
    meta: [
      { title: "Transformers — The Attention Lens | Perceptron Lab" },
      {
        name: "description",
        content:
          "Queries, keys, values, and why attention replaced recurrence — visualized on real sentences with real attention weights.",
      },
    ],
  }),
  component: () => <StationStub station={stationByPath("/transformers")!} />,
});
