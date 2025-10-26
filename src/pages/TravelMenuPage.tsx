import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import EntityCard from "@/components/EntityCard";
import Map from "@/components/Map";
import { Button } from "@/components/ui/Button";
import { DEFAULT_ITINERARY_ID } from "@/lib/constants";
import { toast } from "sonner";
import { useItineraryState } from "@/hooks/useItinerary";

interface Entity {
  id: string;
  name: string;
  region: string;
  tags: string;
  description: string;
  lat: number;
  lng: number;
  image_url: string;
}

const regions = ["All", "San Francisco", "Marin", "Peninsula", "East Bay", "South Bay"];

const TravelMenuPage = () => {
  const { stops, addStop } = useItineraryState();
  const [searchParams, setSearchParams] = useSearchParams();
  const focus = searchParams.get("focus");
  const [selectedId, setSelectedId] = useState<string | undefined>(focus ?? undefined);

  useEffect(() => {
    if (focus) {
      setSelectedId(focus);
    }
  }, [focus]);

  const showMap = searchParams.get("map") === "true";
  const regionFilter = searchParams.get("region") ?? "All";

  const { data, isLoading } = useQuery<{ entities: Entity[] }>({
    queryKey: ["entities"],
    queryFn: async () => {
      const response = await fetch("/api/entities");
      if (!response.ok) throw new Error("Failed to fetch entities");
      return response.json();
    }
  });

  const filtered = useMemo(() => {
    if (!data?.entities) return [];
    if (regionFilter === "All") return data.entities;
    return data.entities.filter((entity) => entity.region === regionFilter);
  }, [data, regionFilter]);

  const markers = useMemo(
    () =>
      filtered.map((entity) => ({
        id: entity.id,
        lat: entity.lat,
        lng: entity.lng,
        name: entity.name,
        category: entity.tags.split(",")[0] ?? "",
        description: entity.description
      })),
    [filtered]
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-steel-gray">Bay Area Travel Menu</h1>
          <p className="mt-2 max-w-xl text-steel-gray/70">
            Curated adventure clusters, remodel inspiration, and family-friendly gems across the
            San Francisco Bay Area.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showMap ? "ghost" : "primary"}
            onClick={() => setSearchParams({ map: "false", region: regionFilter })}
          >
            List View
          </Button>
          <Button
            variant={showMap ? "primary" : "ghost"}
            onClick={() => setSearchParams({ map: "true", region: regionFilter, focus: selectedId ?? "" })}
          >
            Map View
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        {regions.map((region) => (
          <button
            key={region}
            onClick={() =>
              setSearchParams({
                map: showMap ? "true" : "false",
                region,
                focus: selectedId ?? ""
              })
            }
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              regionFilter === region
                ? "bg-muted-green text-white"
                : "bg-white text-steel-gray shadow-sm"
            }`}
          >
            {region}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-steel-gray/70">Loading experiences…</p>}

      {!showMap && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((entity) => (
            <EntityCard
              key={entity.id}
              id={entity.id}
              name={entity.name}
              description={entity.description}
              tags={entity.tags.split(",").map((tag) => tag.trim())}
              image_url={entity.image_url}
              onAdd={async (entityId) => {
                const day = stops.length ? stops[stops.length - 1].day : 1;
                const nextOrder = stops.filter((stop) => stop.day === day).length;
                const merged = [
                  ...stops,
                  { entity_id: entityId, day, order_index: nextOrder }
                ];
                const sorted = [...merged].sort((a, b) =>
                  a.day === b.day ? a.order_index - b.order_index : a.day - b.day
                );
                addStop(entityId, day);
                try {
                  const response = await fetch(`/api/itineraries/${DEFAULT_ITINERARY_ID}/stops`, {
                    method: "PUT",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ stops: sorted })
                  });
                  if (!response.ok) throw new Error();
                  toast.success("Added to itinerary");
                } catch (error) {
                  toast.error("Failed to save itinerary");
                }
              }}
              onViewMap={(entityId) => {
                setSelectedId(entityId);
                setSearchParams({ map: "true", region: regionFilter, focus: entityId });
              }}
            />
          ))}
        </div>
      )}

      {showMap && (
        <div className="card-surface h-[600px] overflow-hidden">
          <Map
            markers={markers}
            selectedId={selectedId}
            onSelect={setSelectedId}
            accessToken={import.meta.env.VITE_MAPBOX_TOKEN ?? ""}
          />
        </div>
      )}
    </div>
  );
};

export default TravelMenuPage;
