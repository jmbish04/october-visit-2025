import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { Env } from "../types";
import { modifyItinerary, surpriseMe } from "../lib/ai";
import { list, run, type ItineraryStopRecord } from "../lib/d1";

const ai = new Hono<Env>();

const modifySchema = z.object({
  itinerary_id: z.string(),
  prompt: z.string().min(3)
});

ai.post("/modify", zValidator("json", modifySchema), async (c) => {
  const { itinerary_id, prompt } = c.req.valid("json");
  const itineraryStops = await list<ItineraryStopRecord>(
    c.env.DB,
    "SELECT * FROM itinerary_stops WHERE itinerary_id = ? ORDER BY day, order_index",
    [itinerary_id]
  );

  const response = await modifyItinerary(c.env.AI, c.env.AI_MODEL ?? "@cf/openchat/openchat-3.5-0106", {
    prompt,
    itinerary: {
      itinerary_id,
      stops: itineraryStops
    }
  });

  const dayOrderCounts = new Map<number, number>();
  for (const stop of itineraryStops) {
    dayOrderCounts.set(stop.day, Math.max(dayOrderCounts.get(stop.day) ?? 0, stop.order_index + 1));
  }

  for (const update of response.updates) {
    if (update.order) {
      await run(
        c.env.DB,
        "DELETE FROM itinerary_stops WHERE itinerary_id = ? AND day = ?",
        [itinerary_id, update.day]
      );
      let index = 0;
      for (const stop of update.order) {
        await run(
          c.env.DB,
          "INSERT INTO itinerary_stops(itinerary_id, entity_id, day, order_index) VALUES(?, ?, ?, ?)",
          [itinerary_id, stop.entity_id, update.day, index++]
        );
      }
      dayOrderCounts.set(update.day, index);
    }

    if (update.add) {
      for (const add of update.add) {
        const orderIndex =
          typeof add.position === "number" ? add.position : dayOrderCounts.get(update.day) ?? 0;
        await run(
          c.env.DB,
          "INSERT INTO itinerary_stops(itinerary_id, entity_id, day, order_index) VALUES(?, ?, ?, ?)",
          [itinerary_id, add.entity_id, update.day, orderIndex]
        );
        dayOrderCounts.set(update.day, orderIndex + 1);
      }
    }

    if (update.remove) {
      for (const remove of update.remove) {
        await run(
          c.env.DB,
          "DELETE FROM itinerary_stops WHERE itinerary_id = ? AND day = ? AND entity_id = ?",
          [itinerary_id, update.day, remove.entity_id]
        );
      }
    }
  }

  const updatedStops = await list<ItineraryStopRecord>(
    c.env.DB,
    "SELECT * FROM itinerary_stops WHERE itinerary_id = ? ORDER BY day, order_index",
    [itinerary_id]
  );

  return c.json({
    itinerary_id,
    stops: updatedStops,
    metadata: response.metadata
  });
});

ai.post(
  "/surprise",
  zValidator("json", z.object({ itinerary_id: z.string() })),
  async (c) => {
    const { itinerary_id } = c.req.valid("json");
    const stops = await list<ItineraryStopRecord>(
      c.env.DB,
      "SELECT * FROM itinerary_stops WHERE itinerary_id = ? ORDER BY day, order_index",
      [itinerary_id]
    );

    const suggestion = await surpriseMe(
      c.env.AI,
      c.env.SURPRISE_MODEL ?? c.env.AI_MODEL ?? "@cf/openchat/openchat-3.5-0106",
      { itinerary_id, stops }
    );

    return c.json(suggestion);
  }
);

export default ai;
