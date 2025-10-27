import { useMemo } from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import type { UniqueIdentifier } from "@dnd-kit/core";
import SortableItem from "@/components/SortableItem";
import { Button } from "@/components/ui/Button";

export interface PlannerStop {
  entity_id: string;
  name: string;
  day: number;
  order_index: number;
  tags: string[];
  driveTime?: string;
}

export interface ItineraryPlannerProps {
  days: number[];
  stops: PlannerStop[];
  onReorder: (day: number, next: PlannerStop[]) => void;
  onOptimize: () => void;
}

const dayLabels = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const ItineraryPlanner = ({ days, stops, onReorder, onOptimize }: ItineraryPlannerProps) => {
  const grouped = useMemo(() => {
    return days.map((day) => ({
      day,
      label: dayLabels[(day - 1) % dayLabels.length],
      stops: stops.filter((stop) => stop.day === day).sort((a, b) => a.order_index - b.order_index)
    }));
  }, [days, stops]);

  const handleDragEnd = (event: DragEndEvent, day: number) => {
    if (!event.over) return;
    const current = grouped.find((group) => group.day === day);
    if (!current) return;

    const oldIndex = current.stops.findIndex((item) => item.entity_id === (event.active.id as string));
    const newIndex = current.stops.findIndex((item) => item.entity_id === (event.over!.id as string));
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(current.stops, oldIndex, newIndex).map((stop, index) => ({
      ...stop,
      order_index: index
    }));

    onReorder(day, reordered);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-steel-gray">Daily itinerary</h2>
        <Button variant="outline" onClick={onOptimize}>
          Optimize Route
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {grouped.map((group) => (
          <section key={group.day} className="card-surface flex flex-col gap-4 p-4">
            <header className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-steel-gray">{group.label}</h3>
              <span className="text-sm text-steel-gray/70">{group.stops.length} stops</span>
            </header>
            <DndContext onDragEnd={(event) => handleDragEnd(event, group.day)}>
              <SortableContext items={group.stops.map((stop) => stop.entity_id as UniqueIdentifier)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {group.stops.map((stop) => (
                    <SortableItem key={stop.entity_id} id={stop.entity_id}>
                      <div className="rounded-xl border border-sandstone/60 bg-white/90 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-steel-gray">{stop.name}</p>
                            <p className="text-xs text-steel-gray/70">{stop.tags.join(" • ")}</p>
                          </div>
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-green">
                            #{stop.order_index + 1}
                          </span>
                        </div>
                        {stop.driveTime && (
                          <p className="mt-2 text-xs text-steel-gray/60">Drive: {stop.driveTime}</p>
                        )}
                      </div>
                    </SortableItem>
                  ))}
                  {!group.stops.length && (
                    <p className="rounded-xl border border-dashed border-sandstone/70 p-6 text-center text-sm text-steel-gray/60">
                      Drop a spot here to plan this day.
                    </p>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </section>
        ))}
      </div>
    </div>
  );
};

export default ItineraryPlanner;
