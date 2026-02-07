import { Opik } from "opik";

/**
 * Opik SDK client for LLM tracing, evaluation, and monitoring.
 * Configure via OPIK_API_KEY and OPIK_PROJECT_NAME in .env.local
 * @see https://www.comet.com/docs/opik/integrations/typescript-sdk
 */
export const opikClient = new Opik({
  apiKey: process.env.OPIK_API_KEY,
  apiUrl: process.env.OPIK_URL_OVERRIDE ?? "https://www.comet.com/opik/api",
  projectName: process.env.OPIK_PROJECT_NAME ?? "bloomflow",
});
