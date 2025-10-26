import { useCallback, useEffect, useState } from "react";

export interface ItineraryStopState {
  entity_id: string;
  day: number;
  order_index: number;
}

const STORAGE_KEY = "bay-area-itinerary";

export function useItineraryState() {
  const [stops, setStops] = useState<ItineraryStopState[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ItineraryStopState[];
        setStops(parsed);
      } catch (error) {
        console.warn("Failed to parse itinerary", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stops));
  }, [stops]);

  const addStop = useCallback((entity_id: string, day?: number) => {
    setStops((prev) => {
      const targetDay = day ?? (prev.length ? prev[prev.length - 1].day : 1);
      const nextOrder = prev.filter((stop) => stop.day === targetDay).length;
      return [...prev, { entity_id, day: targetDay, order_index: nextOrder }];
    });
  }, []);

  const setDayStops = useCallback((day: number, next: ItineraryStopState[]) => {
    setStops((prev) => {
      const other = prev.filter((stop) => stop.day !== day);
      return [...other, ...next];
    });
  }, []);

  const reset = useCallback(() => setStops([]), []);

  const hydrate = useCallback((next: ItineraryStopState[]) => {
    setStops(next);
  }, []);

  return { stops, addStop, setDayStops, reset, hydrate };
}
