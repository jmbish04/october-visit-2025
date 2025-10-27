PRAGMA foreign_keys=OFF;

CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  region TEXT,
  lat REAL,
  lng REAL,
  description TEXT,
  tags TEXT,
  image_url TEXT,
  data_verified INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS clusters (
  cluster_id TEXT PRIMARY KEY,
  cluster_name TEXT NOT NULL,
  focus_theme TEXT,
  stop_sequence TEXT,
  total_drive_time_estimate INTEGER
);

CREATE TABLE IF NOT EXISTS itineraries (
  itinerary_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS itinerary_stops (
  itinerary_id TEXT,
  entity_id TEXT,
  day INTEGER,
  order_index INTEGER,
  PRIMARY KEY (itinerary_id, day, order_index)
);

INSERT INTO entities (id, name, category, region, lat, lng, description, tags, image_url) VALUES
  ("sutro-baths", "Sutro Baths Ruins", "Outdoors", "San Francisco", 37.7802, -122.5135,
    "Sunset-side ruins with dramatic ocean views and cliffside trails.",
    "hiking,history,family", "https://images.unsplash.com/photo-1469474968028-56623f02e42e"),
  ("cavallo-point", "Cavallo Point Lodge", "Stay", "Marin", 37.8356, -122.4770,
    "Golden Gate hideaway mixing historic charm with spa serenity.",
    "spa,views,retreat", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"),
  ("filoli-gardens", "Filoli Historic House & Garden", "Culture", "Peninsula", 37.4563, -122.2636,
    "Century-old estate with seasonal blooms and architecture inspiration.",
    "gardens,architecture,remodel", "https://images.unsplash.com/photo-1469474968028-56623f02e42e"),
  ("pt-reyes", "Point Reyes Lighthouse", "Outdoors", "Marin", 37.9963, -123.0208,
    "Wind-swept cliffs, lighthouse hikes, and foghorn soundtrack perfection.",
    "coastline,hiking,photography", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"),
  ("albany-bulb", "Albany Bulb Art Park", "Outdoors", "East Bay", 37.8884, -122.3196,
    "Upcycled art installations along a bayside trail great for kids.",
    "art,outdoors,kids", "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"),
  ("half-moon-brew", "Half Moon Bay Brewing Co.", "Dining", "Peninsula", 37.5060, -122.4839,
    "Oceanfront brews, chowder, and firepits for coastal evenings.",
    "dining,coastline,relax", "https://images.unsplash.com/photo-1529101091764-c3526daf38fe");

INSERT INTO clusters (cluster_id, cluster_name, focus_theme, stop_sequence, total_drive_time_estimate) VALUES
  ("marin-coastal-loop", "Marin Coastal Loop", "Fog-chasing adventure from Cavallo to Point Reyes",
   "cavallo-point,pt-reyes,albany-bulb", 180),
  ("peninsula-design-day", "Peninsula Design Day", "Historic estates, coastal bites, and remodel inspo",
   "filoli-gardens,half-moon-brew", 120);

INSERT INTO itineraries (itinerary_id, title) VALUES
  ("family-weekend", "Family Remodel + Adventure Weekend");

INSERT INTO itinerary_stops (itinerary_id, entity_id, day, order_index) VALUES
  ("family-weekend", "cavallo-point", 1, 0),
  ("family-weekend", "sutro-baths", 1, 1),
  ("family-weekend", "filoli-gardens", 2, 0),
  ("family-weekend", "half-moon-brew", 2, 1);
