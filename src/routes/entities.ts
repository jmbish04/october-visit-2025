import { Hono } from "hono";
import type { Env } from "../types";
import { list, type EntityRecord } from "../lib/d1";

const entities = new Hono<Env>();

entities.get("/", async (c) => {
  const results = await list<EntityRecord>(c.env.DB, "SELECT * FROM entities ORDER BY name");
  return c.json({ entities: results });
});

entities.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [entity] = await list<EntityRecord>(
    c.env.DB,
    "SELECT * FROM entities WHERE id = ?",
    [id]
  );
  if (!entity) {
    return c.notFound();
  }
  return c.json(entity);
});

export default entities;
