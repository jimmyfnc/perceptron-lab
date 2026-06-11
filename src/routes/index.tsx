import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ML Academy" },
      { name: "description", content: "Learn machine learning, deep learning, and computer vision." },
      { property: "og:title", content: "ML Academy" },
      { property: "og:description", content: "Learn machine learning, deep learning, and computer vision." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero / intro section */}
      <section className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Machine Learning Academy
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            A clean slate for your ML, deep learning, and computer vision curriculum.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/machine-learning"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Machine Learning
            </Link>
            <Link
              to="/deep-learning"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Deep Learning
            </Link>
            <Link
              to="/computer-vision"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Computer Vision
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
