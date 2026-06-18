// Ambient type for the Pendo analytics global, injected at runtime by the
// Pendo snippet (window.pendo). Declaring it lets TypeScript compile the
// `pendo.track(...)` analytics calls without bundling the Pendo SDK types.
export {};

declare global {
  interface PendoSDK {
    track: (eventName: string, metadata?: Record<string, unknown>) => void;
    initialize: (config?: Record<string, unknown>) => void;
    [key: string]: unknown;
  }

  // eslint-disable-next-line no-var
  var pendo: PendoSDK | undefined;

  interface Window {
    pendo?: PendoSDK;
  }
}
