import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

interface EntityDetail {
  id: string;
  name: string;
  description: string;
  image_url: string;
  tags: string;
  why_it_fits?: string;
  nearby_stops?: string;
  events?: string;
}

const EntityPage = () => {
  const { id } = useParams<{ id: string }>();
  const [aiDetails, setAiDetails] = useState<null | {
    description?: string;
    tags?: string[];
    hours?: string;
    images?: string[];
  }>(null);
  const [showAi, setShowAi] = useState(false);

  const { data, isLoading } = useQuery<EntityDetail>({
    queryKey: ["entity", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await fetch(`/api/entities/${id}`);
      if (!response.ok) throw new Error("Entity not found");
      return response.json();
    }
  });

  const enrichMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/enrich", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entity_id: id })
      });
      if (!response.ok) throw new Error("Enrichment failed");
      return response.json();
    },
    onSuccess: (payload) => {
      setAiDetails(payload);
      setShowAi(true);
      toast.success("AI research updated");
    }
  });

  if (isLoading) {
    return <div className="p-6 text-steel-gray/70">Loading entity…</div>;
  }

  if (!data) {
    return <div className="p-6 text-steel-gray/70">Entity not found.</div>;
  }

  const tags = data.tags.split(",").map((tag) => tag.trim());

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6">
      <header className="card-surface overflow-hidden">
        <img src={data.image_url} alt={data.name} className="h-72 w-full object-cover" />
        <div className="space-y-3 p-6">
          <h1 className="text-3xl font-bold text-steel-gray">{data.name}</h1>
          <div className="flex flex-wrap gap-2 text-xs uppercase text-muted-green">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-muted-green/10 px-3 py-1">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-steel-gray/70">{data.description}</p>
        </div>
      </header>

      <section className="card-surface p-6 space-y-4">
        <h2 className="text-xl font-semibold text-steel-gray">Why it fits</h2>
        <p className="text-steel-gray/70">{data.why_it_fits ?? "Tailored for modern family adventures."}</p>
        {data.nearby_stops && (
          <div>
            <h3 className="text-lg font-semibold text-steel-gray">Nearby stops</h3>
            <p className="text-steel-gray/70">{data.nearby_stops}</p>
          </div>
        )}
        {data.events && (
          <div>
            <h3 className="text-lg font-semibold text-steel-gray">Events</h3>
            <p className="text-steel-gray/70">{data.events}</p>
          </div>
        )}
      </section>

      <section className="card-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-steel-gray">AI Findings</h2>
          <Button variant="outline" onClick={() => enrichMutation.mutate()}>
            Research More
          </Button>
        </div>
        {enrichMutation.isPending && <p className="text-sm text-steel-gray/60">Gathering the latest intel…</p>}
        <button
          onClick={() => setShowAi((prev) => !prev)}
          className="text-sm font-semibold text-muted-green underline"
        >
          {showAi ? "Hide" : "Show"} AI findings
        </button>
        {showAi && aiDetails && (
          <div className="space-y-3 rounded-2xl bg-mist p-4 text-sm text-steel-gray/80">
            {aiDetails.description && <p>{aiDetails.description}</p>}
            {aiDetails.hours && <p>Hours: {aiDetails.hours}</p>}
            {aiDetails.tags && (
              <p>
                Tags: {aiDetails.tags.join(", ")}
              </p>
            )}
            {aiDetails.images && aiDetails.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {aiDetails.images.map((url) => (
                  <img key={url} src={url} alt={data.name} className="h-32 w-full rounded-xl object-cover" />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default EntityPage;
