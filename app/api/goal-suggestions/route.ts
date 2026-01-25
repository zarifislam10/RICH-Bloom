/**
 * API Route: /api/goal-suggestions
 * Handles goal coaching requests (content moderation + guidance questions)
 * Thin wrapper that calls the business logic in lib/api/goal-suggestions.ts
 */

import { NextResponse } from "next/server"
import {
  getGoalCoaching,
  PRINCIPLES,
  type CoachResponse,
  type PrincipleId,
} from "@/lib/api/goal-suggestions"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const principleId = body?.principleId as PrincipleId | undefined
    const draft = (body?.draft as string | undefined)?.trim() ?? ""

    // Validate principleId exists and is valid
    if (!principleId || !(principleId in PRINCIPLES)) {
      return NextResponse.json({ error: "Invalid principleId" }, { status: 400 })
    }

    // Call the business logic function
    const result = await getGoalCoaching(principleId, draft)

    return NextResponse.json<CoachResponse>(result, { status: 200 })
  } catch (err: any) {
    console.error("Error in goal-suggestions route:", err)
    return NextResponse.json(
      { error: "Unexpected server error", details: err.message },
      { status: 500 }
    )
  }
}
