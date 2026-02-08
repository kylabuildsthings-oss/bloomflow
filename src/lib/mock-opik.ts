/**
 * Mock Opik SDK for offline demo when DEMO_MODE=true.
 * Mimics the Opik SDK: logs to console and stores traces in localStorage for judge review.
 */

export type MockTraceEntry = {
  timestamp: string;
  name: string;
  [key: string]: unknown;
};

const STORAGE_KEY = "opik_demo_traces";

export const mockOpik = {
  trace: (params: { name: string; input?: Record<string, unknown>; output?: Record<string, unknown> }) => {
    const { name, input = {}, output = {} } = params || { name: "" };
    const data = { ...input, ...output };
    console.log("[OPIK DEMO] Trace:", name, data);

    if (typeof window !== "undefined") {
      try {
        const traces: MockTraceEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
        traces.push({
          timestamp: new Date().toISOString(),
          name,
          ...data,
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(traces));
      } catch (e) {
        console.warn("[OPIK DEMO] localStorage failed:", e);
      }
    }

    return {
      id: "demo_trace_" + Date.now(),
      end: () => {},
    };
  },

  flush: async () => {
    // No-op for mock
  },

  getDemoTraces: (): MockTraceEntry[] => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch {
      return [];
    }
  },

  clearDemoTraces: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
};
