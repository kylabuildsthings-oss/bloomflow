import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase";

const TEST_GROUPS = ["motivation_A", "motivation_B"] as const;

function randomTestGroup(): (typeof TEST_GROUPS)[number] {
  return TEST_GROUPS[Math.floor(Math.random() * TEST_GROUPS.length)];
}

/**
 * POST /api/auth/signup
 * Creates a new profile with random test_group (motivation_A or motivation_B)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
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
        { error: "Supabase is not configured" },
        { status: 503 }
      );
    }

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const testGroup = randomTestGroup();

    const { data: profile, error } = await supabase
      .from("profiles")
      .insert({
        email,
        password_hash: passwordHash,
        test_group: testGroup,
      })
      .select("id, email, test_group")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "Account created successfully",
      email: profile.email,
      test_group: profile.test_group,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
