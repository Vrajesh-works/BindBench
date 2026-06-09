-- BindBench schema — source of truth (claude.md §4 / build spec authored from scratch).
-- Run against the dev pgvector container or the Aurora cluster:
--   psql "$DATABASE_URL" -f drizzle/0001_init.sql
-- or: npm run db:init

-- gen_random_uuid() is built into Postgres 13+ core (Aurora + PGlite), so no
-- uuid-ossp extension is needed. This also matches Drizzle's defaultRandom().
CREATE EXTENSION IF NOT EXISTS vector;

-- ----------------------------------------------------------------------------
-- targets: protein targets a screen runs against
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS targets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  uniprot_id  text,
  sequence    text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- compounds: small-molecule library entries
--   embedding powers the pgvector "similar compounds" stretch feature
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compounds (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  smiles      text NOT NULL,
  source      text,
  embedding   vector(256),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- projects: a screening campaign against one target
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  target_id   uuid NOT NULL REFERENCES targets(id) ON DELETE RESTRICT,
  status      text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'archived')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- screens: one screening run (fan-out of N predictions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS screens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  target_id       uuid NOT NULL REFERENCES targets(id) ON DELETE RESTRICT,
  status          text NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  total_count     integer NOT NULL DEFAULT 0,
  completed_count integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- predictions: one Boltz job per (compound x target) inside a screen
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictions (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id                   uuid NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
  compound_id                 uuid NOT NULL REFERENCES compounds(id) ON DELETE RESTRICT,
  target_id                   uuid NOT NULL REFERENCES targets(id) ON DELETE RESTRICT,
  boltz_job_id                text,
  status                      text NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'running', 'succeeded', 'failed')),
  -- Boltz result fields (mapped exactly from the API response in lib/boltz.ts)
  affinity_pred_value         double precision,
  affinity_probability_binary double precision,
  confidence_score            double precision,
  structure_url               text,
  error                       text,
  started_at                  timestamptz,
  completed_at                timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- usage_events: API/credit accounting for the usage page (200 free preds/mo)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id uuid REFERENCES predictions(id) ON DELETE SET NULL,
  screen_id     uuid REFERENCES screens(id) ON DELETE CASCADE,
  event_type    text NOT NULL,
  credits       integer NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_predictions_status      ON predictions (status);
CREATE INDEX IF NOT EXISTS idx_predictions_screen_id   ON predictions (screen_id);
CREATE INDEX IF NOT EXISTS idx_predictions_compound_id ON predictions (compound_id);
CREATE INDEX IF NOT EXISTS idx_screens_project_id      ON screens (project_id);
CREATE INDEX IF NOT EXISTS idx_projects_target_id      ON projects (target_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_screen_id  ON usage_events (screen_id);

-- pgvector similarity index for "similar compounds" (cosine distance)
CREATE INDEX IF NOT EXISTS idx_compounds_embedding
  ON compounds USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
