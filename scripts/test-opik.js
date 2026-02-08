#!/usr/bin/env node
/**
 * Test Opik connection: sends a sample trace to verify OPIK_API_KEY works.
 * Usage: node scripts/test-opik.js
 * Requires .env.local with OPIK_API_KEY or COMET_API_KEY
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

const apiKey = process.env.OPIK_API_KEY ?? process.env.COMET_API_KEY;

async function main() {
  if (!apiKey) {
    console.error("[Opik] OPIK_API_KEY or COMET_API_KEY not set in .env.local");
    process.exit(1);
  }

  try {
    const { Opik } = await import("opik");
    const client = new Opik({
      apiKey,
      apiUrl: process.env.OPIK_URL_OVERRIDE ?? "https://www.comet.com/opik/api",
      projectName: process.env.OPIK_PROJECT_NAME ?? "bloomflow",
    });

    const trace = client.trace({
      name: "bloomflow_cli_test",
      input: {
        source: "test-opik-script",
        timestamp: new Date().toISOString(),
      },
      output: { success: true },
    });
    trace.end();
    await client.flush();

    console.log("[Opik] ✓ Connection OK. Sample trace sent.");
  } catch (err) {
    console.error("[Opik] Connection failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
