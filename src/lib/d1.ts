/**
 * Helper utilities for interacting with the D1 database.
 */
import type { D1Database, D1Result } from "@cloudflare/workers-types";

type EntityRecord = {
  id: string;
  name: string;
  category: string;
  region: string;
  lat: number;
  lng: number;
  description: string;
  tags: string;
  image_url: string;
  data_verified?: number;
};

type ClusterRecord = {
  cluster_id: string;
  cluster_name: string;
  focus_theme: string;
  stop_sequence: string;
  total_drive_time_estimate: number;
};

type ItineraryRecord = {
  itinerary_id: string;
  title: string;
  created_at: string;
};

type ItineraryStopRecord = {
  itinerary_id: string;
  entity_id: string;
  day: number;
  order_index: number;
};

export type { EntityRecord, ClusterRecord, ItineraryRecord, ItineraryStopRecord };

export interface DatabaseContext {
  db: D1Database;
}

/**
 * Execute a prepared statement and return typed rows.
 */
export async function list<T>(
  db: D1Database,
  sql: string,
  params: Array<string | number | null> = []
): Promise<T[]> {
  const stmt = db.prepare(sql);
  const bound = params.length ? stmt.bind(...params) : stmt;
  const { results } = (await bound.all()) as D1Result<T>;
  return results ?? [];
}

/**
 * Execute a statement that returns a single row.
 */
export async function get<T>(
  db: D1Database,
  sql: string,
  params: Array<string | number | null> = []
): Promise<T | null> {
  const rows = await list<T>(db, sql, params);
  return rows[0] ?? null;
}

/**
 * Execute a run statement for insert/update operations.
 */
export async function run(
  db: D1Database,
  sql: string,
  params: Array<string | number | null> = []
) {
  const stmt = db.prepare(sql);
  const bound = params.length ? stmt.bind(...params) : stmt;
  await bound.run();
}

export function decodeTags(record: EntityRecord): string[] {
  return record.tags ? record.tags.split(",").map((t) => t.trim()) : [];
}

export function encodeTags(tags: string[]): string {
  return tags.join(", ");
}
