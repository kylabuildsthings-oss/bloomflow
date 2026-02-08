import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

/**
 * POST /api/help/safety-viewed
 * Logs when a user views the Safety & Education tab in Help.
 * Used for Opik observability (non-fatal if Opik is not configured).
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (process.env.OPIK_API_KEY || process.env.COMET_API_KEY) {
      const { opikClient } = await import("@/lib/opik");
      const trace = opikClient.trace({
        name: "help_safety_education_viewed",
        input: {
          user_email: session?.user?.email ?? "anonymous",
          page: "help",
          tab: "safety_education",
          timestamp: new Date().toISOString(),
        },
        output: { logged: true },
      });
      trace.end();
      await opikClient.flush();
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Opik] safety-viewed trace failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: true }); // Non-fatal: always succeed
  }
}
