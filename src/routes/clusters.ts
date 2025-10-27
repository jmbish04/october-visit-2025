import { Hono } from "hono";
import type { Env } from "../types";
import { list, type ClusterRecord } from "../lib/d1";

const clusters = new Hono<Env>();

clusters.get("/", async (c) => {
  const results = await list<ClusterRecord>(
    c.env.DB,
    "SELECT * FROM clusters ORDER BY cluster_name"
  );
  return c.json({ clusters: results });
});

clusters.get("/:id", async (c) => {
  const id = c.req.param("id");
  const [cluster] = await list<ClusterRecord>(
    c.env.DB,
    "SELECT * FROM clusters WHERE cluster_id = ?",
    [id]
  );
  if (!cluster) {
    return c.notFound();
  }
  return c.json(cluster);
});

export default clusters;
