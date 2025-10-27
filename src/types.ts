import type { Ai } from "@cloudflare/ai";
import type { D1Database, Fetcher } from "@cloudflare/workers-types";

export interface Env {
  Bindings: {
    DB: D1Database;
    AI: Ai;
    AI_MODEL?: string;
    SURPRISE_MODEL?: string;
    BROWSER: Fetcher;
    MAPBOX_TOKEN?: string;
    GEMINI_KEY?: string;
    CLAUDE_KEY?: string;
  };
}

export type Context = import("hono").Context<Env>;
