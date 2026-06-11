import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/deep-learning")({
  head: () => ({
    meta: [
      { title: "Deep Learning | ML Academy" },
      { name: "description", content: "Deep learning courses and tutorials." },
    ],
  }),
  component: DeepLearningPage,
});

function DeepLearningPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; Home
      </Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
        Deep Learning
      </h1>
      <p className="mt-4 text-muted-foreground">
        This is a stub page for your deep learning content. Add neural network tutorials, frameworks guides, and projects here.
      </p>
    </div>
  );
}
