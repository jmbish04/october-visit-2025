import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../types";
import { list, run, type ItineraryRecord, type ItineraryStopRecord } from "../lib/d1";
import { zValidator } from "@hono/zod-validator";

const itineraries = new Hono<Env>();

const itinerarySchema = z.object({
  itinerary_id: z.string(),
  title: z.string()
});

const stopSchema = z.object({
  entity_id: z.string(),
  day: z.number().int(),
  order_index: z.number().int()
});

itineraries.get("/", async (c) => {
  const records = await list<ItineraryRecord>(
    c.env.DB,
    "SELECT * FROM itineraries ORDER BY created_at DESC"
  );
  const stops = await list<ItineraryStopRecord>(
    c.env.DB,
    "SELECT * FROM itinerary_stops ORDER BY day, order_index"
  );

  const grouped = records.map((itinerary) => ({
    ...itinerary,
    stops: stops.filter((stop) => stop.itinerary_id === itinerary.itinerary_id)
  }));

  return c.json({ itineraries: grouped });
});

itineraries.post("/", zValidator("json", itinerarySchema), async (c) => {
  const { itinerary_id, title } = c.req.valid("json");
  await run(
    c.env.DB,
    "INSERT OR REPLACE INTO itineraries(itinerary_id, title) VALUES(?, ?)",
    [itinerary_id, title]
  );
  return c.json({ itinerary_id, title });
});

itineraries.put(
  "/:id/stops",
  zValidator("json", z.object({ stops: z.array(stopSchema) })),
  async (c) => {
    const itineraryId = c.req.param("id");
    const { stops } = c.req.valid("json");

    await run(
      c.env.DB,
      "DELETE FROM itinerary_stops WHERE itinerary_id = ?",
      [itineraryId]
    );

    for (const stop of stops) {
      await run(
        c.env.DB,
        "INSERT INTO itinerary_stops(itinerary_id, entity_id, day, order_index) VALUES(?, ?, ?, ?)",
        [itineraryId, stop.entity_id, stop.day, stop.order_index]
      );
    }

    return c.json({ itinerary_id: itineraryId, stops });
  }
);

export default itineraries;
