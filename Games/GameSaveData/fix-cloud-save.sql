-- Fix for: "Error exporting saves: Error: API error: 500"
--
-- The Cloudflare Worker (apithingy.jlsniperelite4.workers.dev) is healthy.
-- Its Turso database is missing the table the /save and /load routes use:
--
--   500 {"error":"SQLite error: no such table: gamesaveddata"}
--
-- Run this ONCE on that Turso database:
--   Turso dashboard -> your database -> SQL console -> paste this file -> Run
-- or from a terminal:
--   turso db shell <your-database-name> < fix-cloud-save.sql
--
-- Nothing is deleted. CREATE TABLE IF NOT EXISTS is safe to run more than once.

CREATE TABLE IF NOT EXISTS gamesaveddata (
  username   TEXT PRIMARY KEY,
  saves      TEXT NOT NULL DEFAULT '{}',
  timestamp  TEXT,
  deviceInfo TEXT
);

-- The site sends exactly: username, saves (JSON text), timestamp, deviceInfo.
--
-- If the worker later complains about a column that does not exist, e.g.
--   "no such column: data" or "table gamesaveddata has no column named device_info"
-- add that column instead of recreating the table:
--
--   ALTER TABLE gamesaveddata ADD COLUMN data TEXT;
--   ALTER TABLE gamesaveddata ADD COLUMN device_info TEXT;
--
-- Quick check afterwards (should return 200 and your saves):
--   curl "https://apithingy.jlsniperelite4.workers.dev/load?username=YOUR_USERNAME"
