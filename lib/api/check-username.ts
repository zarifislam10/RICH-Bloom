/**
 * Username validation and moderation logic
 * Handles checking username availability and appropriateness
 */

import { supabase } from "@/lib/supabase"

export type UsernameCheckResponse = {
  available: boolean
  appropriate: boolean
  message: string
}

/**
 * Validates username format (length and characters)
 */
export function validateUsernameFormat(username: string): { valid: boolean; message?: string } {
  if (username.length < 3) {
    return { valid: false, message: "Username must be at least 3 characters long" }
  }

  if (username.length > 20) {
    return { valid: false, message: "Username must be 20 characters or less" }
  }

  // Check for valid characters (alphanumeric, underscore, hyphen only)
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      valid: false,
      message: "Username can only contain letters, numbers, underscores, and hyphens",
    }
  }

  return { valid: true }
}

/**
 * Checks if username is already taken in the database
 */
export async function checkUsernameAvailability(
  username: string
): Promise<{ available: boolean; message?: string }> {
  const normalizedUsername = username.toLowerCase()

  const { data: existingUser, error: checkError } = await supabase
    .from("user_profiles")
    .select("username")
    .eq("username", normalizedUsername)
    .single()

  if (checkError && checkError.code !== "PGRST116") {
    // PGRST116 = no rows returned (username available)
    console.error("Error checking username:", checkError)
    return { available: false, message: "Error checking username availability" }
  }

  if (existingUser) {
    return { available: false, message: "Username is already taken" }
  }

  return { available: true }
}

/**
 * Checks if username is appropriate using Gemini API content moderation
 */
export async function checkUsernameAppropriateness(
  username: string
): Promise<{ appropriate: boolean; message: string }> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    // No API key, skip moderation but still check availability
    return { appropriate: true, message: "Username is available" }
  }

  try {
    const prompt = `
      Check if this username is school-appropriate for students.
      Username: "${username}"
      
      Flag as inappropriate if it contains:
      - Profanity or curse words
      - Hate speech or harassment
      - Threats or violence
      - Sexual content
      - Illegal activity references
      - Bullying or offensive language
      
      Return ONLY valid JSON in this exact format:
      {
        "isAppropriate": boolean,
        "message": string
      }
      
      If appropriate: isAppropriate=true, message="Username is available"
      If inappropriate: isAppropriate=false, message="Username contains inappropriate content. Please choose a different username."
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

    if (res.ok) {
      const data = await res.json()
      const textOut: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""

      try {
        const parsed = JSON.parse(textOut)
        const isAppropriate = Boolean(parsed.isAppropriate)
        const moderationMessage = String(parsed.message || "").trim()

        return {
          appropriate: isAppropriate,
          message: isAppropriate
            ? moderationMessage || "Username is available"
            : moderationMessage || "Username contains inappropriate content",
        }
      } catch {
        // If JSON parse fails, assume appropriate (fail open)
        return { appropriate: true, message: "Username is available" }
      }
    } else {
      // If Gemini API fails, assume appropriate (fail open)
      return { appropriate: true, message: "Username is available" }
    }
  } catch (err) {
    // If API call fails, assume appropriate (fail open)
    console.error("Error checking username appropriateness:", err)
    return { appropriate: true, message: "Username is available" }
  }
}

/**
 * Main function to check username (format, availability, and appropriateness)
 */
export async function checkUsername(username: string): Promise<UsernameCheckResponse> {
  // 1. Validate format
  const formatCheck = validateUsernameFormat(username)
  if (!formatCheck.valid) {
    return {
      available: false,
      appropriate: false,
      message: formatCheck.message || "Invalid username format",
    }
  }

  // 2. Check availability
  const availabilityCheck = await checkUsernameAvailability(username)
  if (!availabilityCheck.available) {
    return {
      available: false,
      appropriate: true, // Format is valid, just taken
      message: availabilityCheck.message || "Username is already taken",
    }
  }

  // 3. Check appropriateness
  const appropriatenessCheck = await checkUsernameAppropriateness(username)
  return {
    available: true,
    appropriate: appropriatenessCheck.appropriate,
    message: appropriatenessCheck.message,
  }
}

