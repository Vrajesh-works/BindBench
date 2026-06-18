// Server-side Pendo Track Event helper.
// Sends events via HTTP POST to the Pendo Track API.

// TODO: Set PENDO_TRACK_EVENT_SECRET in your environment variables.
// This is the x-pendo-integration-key required for server-side track events.
const PENDO_TRACK_EVENT_SECRET = process.env.PENDO_TRACK_EVENT_SECRET;
const PENDO_DATA_HOST = "https://data.pendo.io";

export async function pendoTrackServer(
  event: string,
  properties: Record<string, unknown>,
  visitorId = "system",
  accountId = "system",
) {
  if (!PENDO_TRACK_EVENT_SECRET) {
    console.warn(`[Pendo] Skipping server track "${event}": PENDO_TRACK_EVENT_SECRET not set`);
    return;
  }

  try {
    await fetch(`${PENDO_DATA_HOST}/data/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-pendo-integration-key": PENDO_TRACK_EVENT_SECRET,
      },
      body: JSON.stringify({
        type: "track",
        event,
        visitorId,
        accountId,
        timestamp: Date.now(),
        properties,
      }),
    });
  } catch (e: any) {
    console.error(`[Pendo] Failed to send server track "${event}":`, e?.message);
  }
}
