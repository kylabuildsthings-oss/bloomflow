import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/auth/reset-password
 * Resets password using a valid token from the forgot-password email.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
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

    const { data: resetRow, error: fetchError } = await supabase
      .from("password_reset_tokens")
      .select("email")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (fetchError || !resetRow?.email) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ password_hash: passwordHash })
      .eq("email", resetRow.email);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      );
    }

    // Delete used token
    await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("token", token);

    return NextResponse.json({ message: "Password reset successfully. You can now sign in." });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
