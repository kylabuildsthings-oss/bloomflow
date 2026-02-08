import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ?? process.env.DEMO_USER_EMAIL ?? "demo@bloomflow.com";

/**
 * POST /api/admin/opik-test
 * Sends a sample trace to Opik to verify the connection.
 * Admin only.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!process.env.OPIK_API_KEY && !process.env.COMET_API_KEY) {
      return NextResponse.json({
        ok: false,
        error: "OPIK_API_KEY or COMET_API_KEY not configured",
      });
    }

    const { opikClient } = await import("@/lib/opik");
    if (!opikClient) {
      return NextResponse.json({
        ok: false,
        error: "Opik client not initialized",
      });
    }

    const trace = opikClient.trace({
      name: "bloomflow_connection_test",
      input: {
        source: "admin_test_button",
        timestamp: new Date().toISOString(),
        message: "Sample trace to verify Opik connection",
      },
      output: { success: true },
    });
    trace.end();
    await opikClient.flush();

    return NextResponse.json({ ok: true, message: "Sample trace sent successfully" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Opik] Connection test failed:", msg);
    return NextResponse.json({
      ok: false,
      error: msg,
    });
  }
}
