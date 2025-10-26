import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { Env } from "../types";
import { get, run, encodeTags } from "../lib/d1";

const enrich = new Hono<Env>();

const requestSchema = z.object({
  entity_id: z.string()
});

enrich.post("/", zValidator("json", requestSchema), async (c) => {
  const { entity_id } = c.req.valid("json");
  const entity = await get<{
    id: string;
    name: string;
    description: string;
    tags: string;
  }>(c.env.DB, "SELECT * FROM entities WHERE id = ?", [entity_id]);

  if (!entity) {
    return c.json({ error: "Entity not found" }, 404);
  }

  const payload = {
    query: entity.name,
    existingDescription: entity.description,
    existingTags: entity.tags
  };

  const response = await c.env.BROWSER.fetch("https://browser-render.mcp/run", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return c.json({ error: "Browser enrichment failed" }, 500);
  }

  const result = await response.json<{
    description?: string;
    tags?: string[];
    hours?: string;
    images?: string[];
  }>();

  const description = result.description ?? entity.description;
  const tags = result.tags ?? entity.tags.split(",").map((t) => t.trim());

  await run(
    c.env.DB,
    "UPDATE entities SET description = ?, tags = ?, data_verified = 1 WHERE id = ?",
    [description, encodeTags(tags), entity_id]
  );

  return c.json({
    entity_id,
    description,
    tags,
    hours: result.hours,
    images: result.images ?? []
  });
});

export default enrich;
