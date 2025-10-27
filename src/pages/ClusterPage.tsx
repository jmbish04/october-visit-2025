import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Map, { type MapRoute } from "@/components/Map";

interface Cluster {
  cluster_id: string;
  cluster_name: string;
  focus_theme: string;
  stop_sequence: string;
  total_drive_time_estimate: number;
}

interface Entity {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  tags: string;
}

const ClusterPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: cluster } = useQuery<Cluster>({
    queryKey: ["cluster", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await fetch(`/api/clusters/${id}`);
      if (!response.ok) throw new Error("Cluster not found");
      return response.json();
    }
  });

  const { data: entities } = useQuery<{ entities: Entity[] }>({
    queryKey: ["entities"],
    queryFn: async () => {
      const response = await fetch("/api/entities");
      if (!response.ok) throw new Error("Entities missing");
      return response.json();
    }
  });

  const orderedEntities = useMemo(() => {
    if (!cluster || !entities) return [];
    const ids = cluster.stop_sequence.split(",").map((id) => id.trim());
    const lookup = new Map(entities.entities.map((entity) => [entity.id, entity]));
    return ids
      .map((stopId) => lookup.get(stopId))
      .filter(Boolean) as Entity[];
  }, [cluster, entities]);

  const routes: MapRoute[] = useMemo(() => {
    if (!orderedEntities.length) return [];
    return [
      {
        id: id ?? "route",
        coordinates: orderedEntities.map((entity) => [entity.lng, entity.lat])
      }
    ];
  }, [id, orderedEntities]);

  const markers = orderedEntities.map((entity) => ({
    id: entity.id,
    lat: entity.lat,
    lng: entity.lng,
    name: entity.name,
    category: entity.tags.split(",")[0] ?? "",
    description: entity.description
  }));

  if (!cluster) {
    return <div className="p-6 text-steel-gray/70">Loading cluster…</div>;
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="card-surface p-6 space-y-3">
        <h1 className="text-3xl font-semibold text-steel-gray">{cluster.cluster_name}</h1>
        <p className="text-steel-gray/70">{cluster.focus_theme}</p>
        <p className="text-sm text-steel-gray/60">
          Estimated total drive time: {Math.round(cluster.total_drive_time_estimate / 60)} minutes
        </p>
      </header>

      <div className="card-surface h-[520px] overflow-hidden">
        <Map
          markers={markers}
          routes={routes}
          accessToken={import.meta.env.VITE_MAPBOX_TOKEN ?? ""}
        />
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {orderedEntities.map((entity, index) => (
          <article key={entity.id} className="card-surface p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-steel-gray">{entity.name}</h3>
              <span className="text-sm font-semibold text-muted-green">Stop {index + 1}</span>
            </div>
            <p className="mt-2 text-sm text-steel-gray/70">{entity.description}</p>
            <p className="mt-3 text-xs uppercase text-muted-green">{entity.tags}</p>
          </article>
        ))}
      </section>
    </div>
  );
};

export default ClusterPage;
