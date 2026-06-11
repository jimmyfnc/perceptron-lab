import { createFileRoute } from "@tanstack/react-router";
import { stationByPath } from "@/lib/journey";
import { StationStub } from "@/components/site/StationStub";

export const Route = createFileRoute("/interlude")({
  head: () => ({
    meta: [
      { title: "Two Kinds of Nearest — Interlude | Visionary Labs" },
      {
        name: "description",
        content:
          "Nearest-neighbor interpolation is not K-nearest-neighbors. A short detour through pixel-art scaling to tell them apart.",
      },
    ],
  }),
  component: () => <StationStub station={stationByPath("/interlude")!} />,
});
