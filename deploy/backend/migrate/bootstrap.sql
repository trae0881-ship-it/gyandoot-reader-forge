-- Tracks which migrations have run so re-deploys are safe.
CREATE SCHEMA IF NOT EXISTS railway_meta;
CREATE TABLE IF NOT EXISTS railway_meta.applied_migrations (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;
