/**
 * Goal suggestions and content moderation logic
 * Handles AI-powered guidance questions and content moderation for goals
 */

export type PrincipleId = "i-matter" | "responsibility" | "considerate" | "strategies"

export const PRINCIPLES: Record<PrincipleId, { name: string; context: string }> = {
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

export type CoachResponse = {
  isAppropriate: boolean
  flags: string[]
  message: string
  questions: string[]
}

/**
 * Safely parses JSON string, returns null if invalid
 */
function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T
  } catch {
    return null
  }
}

/**
 * Fallback questions if AI is unavailable
 */
export function getFallbackQuestions(principleId: PrincipleId): string[] {
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

/**
 * Calls Gemini API to get content moderation and guidance questions
 */
async function callGeminiAPI(
  principleId: PrincipleId,
  draft: string
): Promise<CoachResponse | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return null
  }

  const hasDraft = draft.length > 0
  const principle = PRINCIPLES[principleId]

  const prompt = `
    You are a school goal-writing coach.

    RICH Principle: ${principle.name}
    Meaning: ${principle.context}

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

  try {
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

    if (!res.ok) {
      return null
    }

    const data = await res.json()
    const textOut: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    const parsed = safeJsonParse<CoachResponse>(textOut)

    return parsed
  } catch (err) {
    console.error("Error calling Gemini API:", err)
    return null
  }
}

/**
 * Main function to get goal coaching (content moderation + guidance questions)
 */
export async function getGoalCoaching(
  principleId: PrincipleId,
  draft: string
): Promise<CoachResponse> {
  // Validate principle
  if (!principleId || !(principleId in PRINCIPLES)) {
    throw new Error("Invalid principleId")
  }

  // Try to get AI response
  const aiResponse = await callGeminiAPI(principleId, draft)

  // If AI is unavailable, return fallback
  if (!aiResponse) {
    return {
      isAppropriate: true,
      flags: [],
      message: "AI is unavailable right now. Here are some guiding questions:",
      questions: getFallbackQuestions(principleId),
    }
  }

  // Normalize output (defensive: clamp and clean)
  const isAppropriate = Boolean(aiResponse.isAppropriate)
  const flags = Array.isArray(aiResponse.flags)
    ? aiResponse.flags.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 8)
    : []

  const message = String(aiResponse.message ?? "").trim()

  const questions = Array.isArray(aiResponse.questions)
    ? aiResponse.questions.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 6)
    : []

  // Enforce rules even if model disobeys:
  if (!isAppropriate) {
    return {
      isAppropriate: false,
      flags,
      message: message || "Please rewrite using respectful school-appropriate language.",
      questions: [],
    }
  }

  // If no draft or appropriate draft, ensure we give questions
  const finalQuestions = questions.length > 0 ? questions : getFallbackQuestions(principleId)

  return {
    isAppropriate: true,
    flags: [],
    message:
      message ||
      (draft.length > 0
        ? "Here are questions to help refine your goal:"
        : "Start with these guiding questions:"),
    questions: finalQuestions,
  }
}

