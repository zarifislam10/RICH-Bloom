/**
 * API Route: /api/check-username
 * Handles username validation requests
 * Thin wrapper that calls the business logic in lib/api/check-username.ts
 */

import { NextResponse } from "next/server"
import { checkUsername, type UsernameCheckResponse } from "@/lib/api/check-username"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const username = (body?.username as string | undefined)?.trim()

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    // Call the business logic function
    const result = await checkUsername(username)

    return NextResponse.json<UsernameCheckResponse>(result)
  } catch (err: any) {
    console.error("Error in check-username route:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

