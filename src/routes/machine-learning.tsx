import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/machine-learning")({
  head: () => ({
    meta: [
      { title: "Machine Learning | ML Academy" },
      { name: "description", content: "Machine learning courses and tutorials." },
    ],
  }),
  component: MachineLearningPage,
});

function MachineLearningPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; Home
      </Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
        Machine Learning
      </h1>
      <p className="mt-4 text-muted-foreground">
        This is a stub page for your machine learning content. Add lessons, notebooks, and exercises here.
      </p>
    </div>
  );
}
