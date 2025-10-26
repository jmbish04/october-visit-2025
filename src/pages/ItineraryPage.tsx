import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useItineraryState } from "@/hooks/useItinerary";
import ItineraryPlanner, { type PlannerStop } from "@/components/ItineraryPlanner";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { DEFAULT_ITINERARY_ID } from "@/lib/constants";

interface Entity {
  id: string;
  name: string;
  tags: string;
}


interface ItineraryApiResponse {
  itineraries: Array<{
    itinerary_id: string;
    title: string;
    stops: Array<{ entity_id: string; day: number; order_index: number }>;
  }>;
}

const ItineraryPage = () => {
  const queryClient = useQueryClient();
  const { stops: localStops, setDayStops, hydrate } = useItineraryState();
  const [prompt, setPrompt] = useState("");
  const [chatLog, setChatLog] = useState<string[]>([]);

  const { data: entities } = useQuery<{ entities: Entity[] }>({
    queryKey: ["entities", "minimal"],
    queryFn: async () => {
      const response = await fetch("/api/entities");
      if (!response.ok) throw new Error("Failed to load entities");
      return response.json();
    }
  });

  const { data: itineraryData } = useQuery<ItineraryApiResponse>({
    queryKey: ["itineraries"],
    queryFn: async () => {
      const response = await fetch("/api/itineraries");
      if (!response.ok) throw new Error("Failed to load itineraries");
      return response.json();
    }
  });

  useEffect(() => {
    if (!itineraryData?.itineraries?.length || localStops.length) return;
    const itinerary = itineraryData.itineraries.find((i) => i.itinerary_id === DEFAULT_ITINERARY_ID);
    if (!itinerary) return;
    const sorted = [...itinerary.stops]
      .map((stop) => ({ entity_id: stop.entity_id, day: stop.day, order_index: stop.order_index }))
      .sort((a, b) => (a.day === b.day ? a.order_index - b.order_index : a.day - b.day));
    hydrate(sorted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrate, itineraryData, localStops.length]);

  const plannerStops: PlannerStop[] = useMemo(() => {
    const lookup = new Map(entities?.entities.map((entity) => [entity.id, entity]));
    return localStops
      .map((stop) => {
        const entity = lookup.get(stop.entity_id);
        return entity
          ? {
              entity_id: stop.entity_id,
              name: entity.name,
              day: stop.day,
              order_index: stop.order_index,
              tags: entity.tags.split(",").map((tag) => tag.trim())
            }
          : null;
      })
      .filter(Boolean) as PlannerStop[];
  }, [entities, localStops]);

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai/modify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itinerary_id: DEFAULT_ITINERARY_ID, prompt: "Optimize the driving order" })
      });
      if (!response.ok) throw new Error("Optimization failed");
      return response.json();
    },
    onSuccess: async (payload: { stops: { entity_id: string; day: number; order_index: number }[] }) => {
      toast.success("Route optimized with Cloudflare AI");
      hydrate(
        payload.stops.map((stop) => ({
          entity_id: stop.entity_id,
          day: stop.day,
          order_index: stop.order_index
        }))
      );
      await queryClient.invalidateQueries({ queryKey: ["itineraries"] });
    }
  });

  const persistStops = useCallback((stopsToPersist: { entity_id: string; day: number; order_index: number }[]) => {
    return fetch(`/api/itineraries/${DEFAULT_ITINERARY_ID}/stops`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stops: stopsToPersist })
    }).then((response) => {
      if (!response.ok) {
        throw new Error("Failed to persist");
      }
      return response;
    });
  }, []);

  const chatMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai/modify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itinerary_id: DEFAULT_ITINERARY_ID, prompt })
      });
      if (!response.ok) throw new Error("AI modification failed");
      return response.json();
    },
    onSuccess: (payload) => {
      setChatLog((prev) => [prompt, `AI updated ${payload.stops.length} stops`, ...prev]);
      setPrompt("");
      toast.success("Plan updated");
      hydrate(
        payload.stops.map((stop: { entity_id: string; day: number; order_index: number }) => ({
          entity_id: stop.entity_id,
          day: stop.day,
          order_index: stop.order_index
        }))
      );
      queryClient.invalidateQueries({ queryKey: ["itineraries"] });
    }
  });

  const handleReorder = (day: number, reordered: PlannerStop[]) => {
    const next = reordered.map((stop, index) => ({
      entity_id: stop.entity_id,
      day,
      order_index: index
    }));
    setDayStops(day, next);

    const merged = [
      ...localStops.filter((stop) => stop.day !== day),
      ...next
    ].sort((a, b) => (a.day === b.day ? a.order_index - b.order_index : a.day - b.day));

    void persistStops(merged).catch(() => {
      toast.error("Failed to persist itinerary");
    });
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 md:flex-row">
      <div className="flex-1 space-y-6">
        <div className="card-surface p-6">
          <h1 className="text-3xl font-semibold text-steel-gray">Family Weekend Planner</h1>
          <p className="mt-2 text-steel-gray/70">
            Drag stops to reorder by day, or let Cloudflare AI remix the plan with contextual chat prompts.
          </p>
        </div>
        <ItineraryPlanner
          days={[1, 2, 3, 4]}
          stops={plannerStops}
          onReorder={handleReorder}
          onOptimize={() => optimizeMutation.mutate()}
        />
        <Button
          variant="outline"
          onClick={async () => {
            const response = await fetch("/api/ai/surprise", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ itinerary_id: DEFAULT_ITINERARY_ID })
            });
            if (!response.ok) {
              toast.error("Surprise suggestion failed");
              return;
            }
            const suggestion = await response.json();
            toast.message(suggestion.title, {
              description: suggestion.description
            });
          }}
        >
          Surprise Me
        </Button>
      </div>
      <aside id="chat" className="card-surface flex w-full max-w-sm flex-col gap-4 p-6">
        <h2 className="text-xl font-semibold text-steel-gray">Modify Plan</h2>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="min-h-[120px] rounded-2xl border border-sandstone/60 bg-white/80 p-3 text-sm focus:border-muted-green focus:outline-none"
          placeholder="Swap Sunday's outing for a beach day in Marin"
        />
        <Button onClick={() => chatMutation.mutate()} disabled={!prompt}>
          Send to AI
        </Button>
        <div className="max-h-64 space-y-3 overflow-y-auto">
          {chatLog.map((entry, index) => (
            <p key={index} className="rounded-xl bg-mist p-3 text-sm text-steel-gray/80">
              {entry}
            </p>
          ))}
        </div>
      </aside>
    </div>
  );
};

export default ItineraryPage;
