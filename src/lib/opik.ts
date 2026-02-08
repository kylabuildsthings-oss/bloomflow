import { Opik } from "opik";
import { mockOpik } from "./mock-opik";

const apiKey = process.env.OPIK_API_KEY ?? process.env.COMET_API_KEY;
const isDemoMode =
  process.env.DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/**
 * Opik SDK client for LLM tracing, evaluation, and monitoring.
 * Uses mock when DEMO_MODE=true; otherwise real SDK when OPIK_API_KEY or COMET_API_KEY is set.
 * @see https://www.comet.com/docs/opik/integrations/typescript-sdk
 */
export const opikClient = isDemoMode
  ? (mockOpik as unknown as Opik)
  : apiKey
    ? new Opik({
        apiKey,
        apiUrl: process.env.OPIK_URL_OVERRIDE ?? "https://www.comet.com/opik/api",
        projectName: process.env.OPIK_PROJECT_NAME ?? "bloomflow",
      })
    : (null as unknown as Opik);

/** Mock Opik helpers for demo judge review (getDemoTraces, clearDemoTraces) */
export { mockOpik };

export type UserEventMetadata = {
  userId?: string;
  testGroup?: string | null;
  cyclePhase?: string;
  actionType: string;
  [key: string]: unknown;
};

/**
 * Log a user action event to Opik for A/B testing and analytics.
 * Standardizes metadata: userId, testGroup, cyclePhase, actionType.
 * Non-fatal: errors are swallowed.
 */
export async function logUserEvent(
  eventName: string,
  metadata: UserEventMetadata
): Promise<void> {
  if (!opikClient) return;
  try {
    const trace = opikClient.trace({
      name: eventName,
      input: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      output: { logged: true },
    });
    trace.end();
    await opikClient.flush();
  } catch (err) {
    console.error("[Opik] logUserEvent failed:", err instanceof Error ? err.message : err);
    // Non-fatal: app continues without breaking user experience
  }
}
