import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";
import crypto from "crypto";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * POST /api/auth/forgot-password
 * Sends a password reset email. Always returns success to avoid email enumeration.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 503 }
      );
    }

    // Check if user exists (only accounts with password_hash - not demo)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    // Always return success to prevent email enumeration
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

    if (profile?.id && resend) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await supabase.from("password_reset_tokens").insert({
        email,
        token,
        expires_at: expiresAt.toISOString(),
      });

      const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "BloomFlow <onboarding@resend.dev>",
        to: email,
        subject: "Reset your BloomFlow password",
        html: `
          <p>You requested a password reset for BloomFlow.</p>
          <p><a href="${resetUrl}" style="color: #87A96B; font-weight: bold;">Reset password</a></p>
          <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
          <p>BloomFlow</p>
        `,
      });
    }

    return NextResponse.json({
      message: "If an account exists with that email, you will receive a password reset link.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
