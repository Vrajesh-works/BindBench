// Drizzle schema — mirrors drizzle/0001_init.sql (the hand-written DDL is the
// source of truth; this gives typed queries). Keep the two in sync.
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  doublePrecision,
  vector,
  index,
} from "drizzle-orm/pg-core";

export const targets = pgTable("targets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  uniprotId: text("uniprot_id"),
  sequence: text("sequence").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const compounds = pgTable(
  "compounds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    smiles: text("smiles").notNull(),
    source: text("source"),
    embedding: vector("embedding", { dimensions: 256 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_compounds_embedding").using(
      "ivfflat",
      t.embedding.op("vector_cosine_ops"),
    ),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    targetId: uuid("target_id")
      .notNull()
      .references(() => targets.id, { onDelete: "restrict" }),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_projects_target_id").on(t.targetId)],
);

export const screens = pgTable(
  "screens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    targetId: uuid("target_id")
      .notNull()
      .references(() => targets.id, { onDelete: "restrict" }),
    status: text("status").notNull().default("queued"),
    totalCount: integer("total_count").notNull().default(0),
    completedCount: integer("completed_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_screens_project_id").on(t.projectId)],
);

export const predictions = pgTable(
  "predictions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    screenId: uuid("screen_id")
      .notNull()
      .references(() => screens.id, { onDelete: "cascade" }),
    compoundId: uuid("compound_id")
      .notNull()
      .references(() => compounds.id, { onDelete: "restrict" }),
    targetId: uuid("target_id")
      .notNull()
      .references(() => targets.id, { onDelete: "restrict" }),
    boltzJobId: text("boltz_job_id"),
    status: text("status").notNull().default("pending"),
    affinityPredValue: doublePrecision("affinity_pred_value"),
    affinityProbabilityBinary: doublePrecision("affinity_probability_binary"),
    confidenceScore: doublePrecision("confidence_score"),
    structureUrl: text("structure_url"),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_predictions_status").on(t.status),
    index("idx_predictions_screen_id").on(t.screenId),
    index("idx_predictions_compound_id").on(t.compoundId),
  ],
);

export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    predictionId: uuid("prediction_id").references(() => predictions.id, {
      onDelete: "set null",
    }),
    screenId: uuid("screen_id").references(() => screens.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    credits: integer("credits").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_usage_events_screen_id").on(t.screenId)],
);

// Convenience types
export type Target = typeof targets.$inferSelect;
export type Compound = typeof compounds.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Screen = typeof screens.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
export type UsageEvent = typeof usageEvents.$inferSelect;
