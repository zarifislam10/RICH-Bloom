import { NextResponse } from "next/server"

type PrincipleId = "i-matter" | "responsibility" | "considerate" | "strategies"

const PRINCIPLES: Record<PrincipleId, { name: string; context: string }> = {
  "i-matter": {
    name: "I Matter",
    context: "Self-worth, confidence, healthy habits, positive self-talk.",
  },
  responsibility: {
    name: "Responsibility",
    context: "Ownership, commitments, time management, finishing work before fun.",
  },
  considerate: {
    name: "Considerate",
    context: "Kindness, empathy, listening, helping others respectfully.",
  },
  strategies: {
    name: "Strategies",
    context: "Planning, breaking tasks into steps, study and organization skills.",
  },
}

type CoachResponse = {
  isAppropriate: boolean
  flags: string[]
  message: string
  questions: string[]
}

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T
  } catch {
    return null
  }
}

function fallbackQuestions(principleId: PrincipleId): string[] {
  const byPrinciple: Record<PrincipleId, string[]> = {
    "i-matter": [
      "What is one positive habit you want to build?",
      "When will you practice it each day?",
      "How will you remind yourself to do it?",
      "How will you track your progress this week?",
      "What will you do if you miss a day?",
    ],
    responsibility: [
      "What responsibility are you trying to improve?",
      "When exactly will you do it each day?",
      "What is the first small step you can start with?",
      "How will you prove you completed it?",
      "What might distract you, and how will you handle it?",
    ],
    considerate: [
      "Who do you want to be more considerate toward?",
      "What is one kind action you can do this week?",
      "When and where will you do it?",
      "How will you know it helped the other person?",
      "What will you do if you feel impatient or annoyed?",
    ],
    strategies: [
      "What goal are you trying to reach?",
      "What are the 3 smallest steps to start?",
      "When will you do step 1?",
      "What tool will you use to stay organized (planner, notes, timer)?",
      "How will you measure progress by the end of the week?",
    ],
  }

  return byPrinciple[principleId]
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const principleId = body?.principleId as PrincipleId | undefined
    const draft = (body?.draft as string | undefined)?.trim() ?? ""

    if (!principleId || !(principleId in PRINCIPLES)) {
      return NextResponse.json({ error: "Invalid principleId" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server misconfigured (missing GEMINI_API_KEY)" },
        { status: 500 }
      )
    }

    const hasDraft = draft.length > 0

    const prompt = `
      You are a school goal-writing coach.

      RICH Principle: ${PRINCIPLES[principleId].name}
      Meaning: ${PRINCIPLES[principleId].context}

      ${hasDraft ? `Student draft goal:\n"${draft}"` : "Student has not written a draft yet."}

      Tasks:
      1) If a draft was provided, check if it is school-appropriate.
        Flag if it contains: profanity, hate/harassment, threats/violence, self-harm, sexual content, illegal activity, bullying.
        If flagged, DO NOT generate coaching questions. Ask the student to rewrite respectfully.
      2) If no draft was provided OR the draft is appropriate, generate 5 guiding questions (NOT suggestions).
        Questions should help the student write a specific, measurable goal aligned to the principle.
        Questions must be short and student-friendly.

      Output MUST be valid JSON ONLY in this exact shape:
      {
        "isAppropriate": boolean,
        "flags": string[],
        "message": string,
        "questions": string[]
      }

      Rules:
      - If no draft was provided: isAppropriate=true, flags=[], questions must have 5 items
      - If draft is inappropriate: questions must be []
      - If draft is appropriate: questions must have 5 items
      - No extra keys or commentary. Return ONLY JSON.
    `.trim()

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )

    const data = await res.json()

    if (!res.ok) {
      // If Gemini is down / quota limited, do NOT break the app.
      const out: CoachResponse = {
        isAppropriate: true,
        flags: [],
        message: "AI is unavailable right now. Here are some guiding questions:",
        questions: fallbackQuestions(principleId),
      }
      return NextResponse.json(out, { status: 200 })
    }

    const textOut: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    const parsed = safeJsonParse<CoachResponse>(textOut)

    if (!parsed) {
      const out: CoachResponse = {
        isAppropriate: true,
        flags: [],
        message: "AI response was not formatted correctly. Try again.",
        questions: fallbackQuestions(principleId),
      }
      return NextResponse.json(out, { status: 200 })
    }

    // Normalize output (defensive: clamp and clean)
    const isAppropriate = Boolean(parsed.isAppropriate)
    const flags = Array.isArray(parsed.flags)
      ? parsed.flags.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 8)
      : []

    const message = String(parsed.message ?? "").trim()

    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 6)
      : []

    // Enforce your rules even if model disobeys:
    if (!isAppropriate) {
      return NextResponse.json<CoachResponse>(
        {
          isAppropriate: false,
          flags,
          message: message || "Please rewrite using respectful school-appropriate language.",
          questions: [],
        },
        { status: 200 }
      )
    }

    // If no draft or appropriate draft, ensure we give questions
    const finalQuestions = questions.length > 0 ? questions : fallbackQuestions(principleId)

    return NextResponse.json<CoachResponse>(
      {
        isAppropriate: true,
        flags: [],
        message: message || (hasDraft ? "Here are questions to help refine your goal:" : "Start with these guiding questions:"),
        questions: finalQuestions,
      },
      { status: 200 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { error: "Unexpected server error", details: err.message },
      { status: 500 }
    )
  }
}
