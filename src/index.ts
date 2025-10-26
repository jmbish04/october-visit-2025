/// <reference types="@cloudflare/workers-types" />
import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";
import entities from "./routes/entities";
import clusters from "./routes/clusters";
import itineraries from "./routes/itineraries";
import ai from "./routes/ai";
import enrich from "./routes/enrich";

const app = new Hono();

app.route("/api/entities", entities);
app.route("/api/clusters", clusters);
app.route("/api/itineraries", itineraries);
app.route("/api/ai", ai);
app.route("/api/enrich", enrich);

app.get("/api/health", (c) => c.json({ status: "ok" }));

app.get("/dist/*", serveStatic({ root: "./public" }));
app.get("/assets/*", serveStatic({ root: "./public" }));
app.get("/*", serveStatic({ path: "./public/dist/index.html" }));

export default app;
