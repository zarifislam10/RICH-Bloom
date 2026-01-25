/**
 * API Route: /api/create-profile
 * Server-side profile creation during signup
 * Uses service role to bypass RLS issues
 */

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key for server-side operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key (server-side only)
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { user_id, username } = body

    if (!user_id || !username) {
      return NextResponse.json(
        { error: "user_id and username are required" },
        { status: 400 }
      )
    }

    // Validate username format
    const normalizedUsername = username.trim().toLowerCase()
    if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters" },
        { status: 400 }
      )
    }

    if (!/^[a-z0-9_-]+$/.test(normalizedUsername)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, underscores, and hyphens" },
        { status: 400 }
      )
    }

    // Check if username is already taken
    const { data: existing } = await supabaseAdmin
      .from("user_profiles")
      .select("username")
      .eq("username", normalizedUsername)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      )
    }

    // Create profile using service role (bypasses RLS)
    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .insert([
        {
          user_id,
          username: normalizedUsername,
        },
      ])

    if (profileError) {
      console.error("Error creating profile:", profileError)
      return NextResponse.json(
        { error: profileError.message || "Failed to create profile" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: "Profile created successfully" })
  } catch (err: any) {
    console.error("Error in create-profile API:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

