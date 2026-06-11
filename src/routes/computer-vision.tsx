import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/computer-vision")({
  head: () => ({
    meta: [
      { title: "Computer Vision | ML Academy" },
      { name: "description", content: "Computer vision courses and tutorials." },
    ],
  }),
  component: ComputerVisionPage,
});

function ComputerVisionPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; Home
      </Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
        Computer Vision
      </h1>
      <p className="mt-4 text-muted-foreground">
        This is a stub page for your computer vision content. Add image processing lessons, OpenCV tutorials, and project ideas here.
      </p>
    </div>
  );
}
