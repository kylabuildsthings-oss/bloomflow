import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ?? process.env.DEMO_USER_EMAIL ?? "demo@bloomflow.com";

const OPIK_API_KEY = process.env.OPIK_API_KEY ?? process.env.COMET_API_KEY;
const OPIK_WORKSPACE = process.env.OPIK_WORKSPACE_NAME ?? process.env.COMET_WORKSPACE;
const OPIK_URL = process.env.OPIK_URL_OVERRIDE ?? "https://www.comet.com/opik/api";
const PROJECT_NAME = process.env.OPIK_PROJECT_NAME ?? "bloomflow";

/**
 * GET /api/admin/opik-traces
 * Fetches last 5 bloom_guide_ai traces from Opik for the trace viewer.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!OPIK_API_KEY) {
      return NextResponse.json({
        traces: [],
        error: "OPIK_API_KEY or COMET_API_KEY not configured",
      });
    }

    const url = new URL(`${OPIK_URL}/v1/private/traces`);
    url.searchParams.set("project_name", PROJECT_NAME);
    url.searchParams.set("size", "20"); // Fetch more, filter to bloom_guide_ai

    const headers: Record<string, string> = {
      Accept: "application/json",
      authorization: OPIK_API_KEY,
    };
    if (OPIK_WORKSPACE) {
      headers["Comet-Workspace"] = OPIK_WORKSPACE;
    }

    const res = await fetch(url.toString(), { headers });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({
        traces: [],
        error: `Opik API error: ${res.status} ${text.slice(0, 200)}`,
      });
    }

    const data = (await res.json()) as {
      content?: Array<{
        id: string;
        name: string;
        start_time?: string;
        input?: unknown;
        output?: unknown;
        metadata?: unknown;
      }>;
    };

    const allTraces = data.content ?? [];
    const bloomTraces = allTraces
      .filter((t) => t.name === "bloom_guide_ai")
      .slice(0, 5);

    return NextResponse.json({
      traces: bloomTraces.map((t) => ({
        id: t.id,
        name: t.name,
        startTime: t.start_time,
        input: t.input,
        output: t.output,
        metadata: t.metadata,
      })),
    });
  } catch (err) {
    return NextResponse.json({
      traces: [],
      error: err instanceof Error ? err.message : "Failed to fetch traces",
    });
  }
}
