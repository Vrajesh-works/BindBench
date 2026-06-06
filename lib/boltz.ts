// Boltz API client (boltz.bio) — model boltz-2.1, "structure-and-binding".
//
// claude.md §10 flags three fragile spots; all are isolated here:
//   1. Auth header style (Bearer vs X-API-Key)  -> BOLTZ_AUTH_STYLE
//   2. Base URL / endpoint paths                -> BOLTZ_BASE_URL + ENDPOINTS below
//   3. Response JSON key names                  -> mapPrediction() below
// Verify all three against the boltz.bio docs "HTTP" tab before live wiring.
//
// BOLTZ_MOCK=true short-circuits the network entirely with deterministic fake
// results, so the whole fan-out -> poll -> rank loop works without a key and
// without burning the 200 free predictions/month.

export type PredictionStatus = "pending" | "running" | "succeeded" | "failed";

export interface StartPredictionInput {
  proteinSequence: string;
  ligandSmiles: string;
  /** stable key (e.g. predictions.id) used to make mock results deterministic */
  seed?: string;
}

export interface PredictionResult {
  status: PredictionStatus;
  affinityPredValue: number | null;
  affinityProbabilityBinary: number | null;
  confidenceScore: number | null;
  structureUrl: string | null;
  error?: string | null;
}

const BASE_URL = process.env.BOLTZ_BASE_URL ?? "https://api.boltz.bio";
const API_KEY = process.env.BOLTZ_API_KEY ?? "";
const AUTH_STYLE = (process.env.BOLTZ_AUTH_STYLE ?? "bearer").toLowerCase();
const MOCK = process.env.BOLTZ_MOCK === "true";

// Endpoint paths — adjust to match the docs HTTP tab if they differ.
const ENDPOINTS = {
  create: "/v1/predictions",
  get: (jobId: string) => `/v1/predictions/${jobId}`,
};

function authHeaders(): Record<string, string> {
  if (!API_KEY) return {};
  return AUTH_STYLE === "apikey"
    ? { "X-API-Key": API_KEY }
    : { Authorization: `Bearer ${API_KEY}` };
}

/** Centralized response mapping — the single edit point if Boltz key names differ. */
function mapPrediction(raw: any): PredictionResult {
  const rawStatus: string = (raw?.status ?? raw?.state ?? "running").toLowerCase();
  const status: PredictionStatus =
    rawStatus === "succeeded" || rawStatus === "completed" || rawStatus === "success"
      ? "succeeded"
      : rawStatus === "failed" || rawStatus === "error"
        ? "failed"
        : rawStatus === "pending" || rawStatus === "queued"
          ? "pending"
          : "running";

  const out = raw?.output ?? raw?.result ?? raw ?? {};
  const num = (v: unknown): number | null =>
    typeof v === "number" ? v : v == null ? null : Number(v);

  return {
    status,
    affinityPredValue: num(out.affinity_pred_value),
    affinityProbabilityBinary: num(out.affinity_probability_binary),
    confidenceScore: num(out.confidence_score),
    structureUrl: out.structure_url ?? out.structure ?? out.cif_url ?? null,
    error: raw?.error ?? null,
  };
}

// ---------------------------------------------------------------------------
// Mock implementation (deterministic from seed)
// ---------------------------------------------------------------------------
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff; // 0..1
}

function mockResult(jobId: string): PredictionResult {
  const r = hash(jobId);
  const r2 = hash(jobId + "x");
  return {
    status: "succeeded",
    // pIC50-like value, higher = stronger binder
    affinityPredValue: Number((4 + r * 5).toFixed(3)),
    affinityProbabilityBinary: Number(r2.toFixed(3)),
    confidenceScore: Number((0.5 + r * 0.5).toFixed(3)),
    structureUrl: `https://files.rcsb.org/download/1CRN.cif`, // placeholder CIF for the viewer
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function startPrediction(
  input: StartPredictionInput,
): Promise<{ jobId: string }> {
  if (MOCK) {
    const jobId = `mock_${input.seed ?? Math.random().toString(36).slice(2)}`;
    return { jobId };
  }

  const body = {
    model: "boltz-2.1",
    task: "structure-and-binding",
    sequences: [
      { type: "protein", id: "A", sequence: input.proteinSequence },
      { type: "ligand", id: "L", smiles: input.ligandSmiles, binder: true },
    ],
    properties: { affinity: { binder: "L" } },
  };

  const res = await fetch(`${BASE_URL}${ENDPOINTS.create}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Boltz start failed: ${res.status} ${await res.text()}`);
  }
  const json: any = await res.json();
  const jobId = json?.id ?? json?.job_id ?? json?.prediction_id;
  if (!jobId) throw new Error(`Boltz start: no job id in response: ${JSON.stringify(json)}`);
  return { jobId: String(jobId) };
}

export async function getPrediction(jobId: string): Promise<PredictionResult> {
  if (MOCK || jobId.startsWith("mock_")) {
    return mockResult(jobId);
  }

  const res = await fetch(`${BASE_URL}${ENDPOINTS.get(jobId)}`, {
    method: "GET",
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    throw new Error(`Boltz get failed: ${res.status} ${await res.text()}`);
  }
  return mapPrediction(await res.json());
}

export const isMock = MOCK;
