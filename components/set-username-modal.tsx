"use client"

/**
 * Modal component for existing users to set their username
 * Shows when a user is logged in but doesn't have a username in user_profiles
 */

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function SetUsernameModal() {
  const { user, username, loading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [validationMessage, setValidationMessage] = useState("")

  // Show modal if user is logged in but has no username
  // Add a small delay to avoid showing it if username is still loading
  useEffect(() => {
    if (!loading && user && !username) {
      // Wait a bit to make sure username isn't still loading
      const timer = setTimeout(() => {
        // Double-check username is still null after delay
        if (!username) {
          setIsOpen(true)
        }
      }, 1000) // Wait 1 second before showing

      return () => clearTimeout(timer)
    } else {
      setIsOpen(false)
    }
  }, [user, username, loading])

  // Check username availability and appropriateness in real-time
  const checkUsername = async (value: string) => {
    if (!value.trim()) {
      setValidationMessage("")
      setError("")
      return
    }

    setIsChecking(true)
    setError("")

    try {
      const res = await fetch("/api/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: value }),
      })

      const data = await res.json()

      if (!data.available) {
        setError(data.message || "Username is not available")
        setValidationMessage("")
      } else if (!data.appropriate) {
        setError(data.message || "Username contains inappropriate content")
        setValidationMessage("")
      } else {
        setError("")
        setValidationMessage(data.message || "Username is available!")
      }
    } catch (err) {
      setError("Error checking username. Please try again.")
      setValidationMessage("")
    } finally {
      setIsChecking(false)
    }
  }

  // Handle username input change with debouncing
  useEffect(() => {
    if (!newUsername.trim()) {
      setValidationMessage("")
      setError("")
      return
    }

    // Basic format validation
    if (newUsername.length < 3) {
      setError("Username must be at least 3 characters")
      setValidationMessage("")
      return
    }

    if (newUsername.length > 20) {
      setError("Username must be 20 characters or less")
      setValidationMessage("")
      return
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
      setError("Username can only contain letters, numbers, underscores, and hyphens")
      setValidationMessage("")
      return
    }

    // Debounce the API call
    const timer = setTimeout(() => {
      checkUsername(newUsername)
    }, 500)

    return () => clearTimeout(timer)
  }, [newUsername])

  const handleSave = async () => {
    if (!user || !newUsername.trim()) return

    // Final validation
    if (newUsername.length < 3 || newUsername.length > 20) {
      setError("Username must be 3-20 characters")
      return
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
      setError("Username can only contain letters, numbers, underscores, and hyphens")
      return
    }

    setIsSaving(true)
    setError("")

    try {
      // Check one more time before saving
      const res = await fetch("/api/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername }),
      })

      const data = await res.json()

      if (!data.available || !data.appropriate) {
        setError(data.message || "Username is not available or appropriate")
        setIsSaving(false)
        return
      }

      // Create user profile with username
      const { error: profileError } = await supabase.from("user_profiles").insert([
        {
          user_id: user.id,
          username: newUsername.trim().toLowerCase(),
        },
      ])

      if (profileError) {
        if (profileError.code === "23505") {
          // Unique constraint violation
          setError("Username already taken. Please choose another.")
        } else {
          setError(profileError.message || "Error saving username")
        }
      } else {
        // Success! Close modal and reload to update username in context
        setIsOpen(false)
        window.location.reload() // Simple way to refresh the auth context
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  // Don't render if user has username or is still loading
  if (loading || !user || username) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      {/* Prevent closing - user must set username */}
      <DialogContent
        className="sm:max-w-[500px] bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 border-2 border-purple-200 rounded-2xl shadow-2xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center pb-2">
          <div className="flex justify-center mb-2">
            <div className="text-6xl animate-bounce">🎨</div>
          </div>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Choose Your Awesome Username!
          </DialogTitle>
          <DialogDescription className="text-base text-gray-700 pt-2">
            <span className="text-lg">👋</span> Welcome back! Pick a cool username that shows who you are!
            <br />
            <span className="text-sm text-gray-600">(Don't worry, you can't change it later, so choose wisely!)</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-3">
            <Label htmlFor="username" className="text-lg font-semibold text-purple-700 flex items-center gap-2">
              <span>✨</span> Your Username
            </Label>
            <Input
              id="username"
              placeholder="e.g., super_student123, goal_master, awesome_learner"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              disabled={isSaving || isChecking}
              className={`text-lg h-12 rounded-xl border-2 transition-all ${
                error
                  ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200"
                  : validationMessage
                    ? "border-green-400 bg-green-50 focus:border-green-500 focus:ring-green-200"
                    : "border-purple-300 focus:border-purple-500 focus:ring-purple-200"
              }`}
            />
            
            {/* Status Messages */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-100 border-2 border-red-300 rounded-xl">
                <span className="text-xl">❌</span>
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}
            {validationMessage && !error && (
              <div className="flex items-center gap-2 p-3 bg-green-100 border-2 border-green-300 rounded-xl animate-pulse">
                <span className="text-xl">✅</span>
                <p className="text-sm font-medium text-green-700">{validationMessage}</p>
              </div>
            )}
            {isChecking && (
              <div className="flex items-center gap-2 p-3 bg-blue-100 border-2 border-blue-300 rounded-xl">
                <span className="text-xl animate-spin">⏳</span>
                <p className="text-sm font-medium text-blue-700">Checking if your username is available...</p>
              </div>
            )}
            
            {/* Helpful Tips */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <span>💡</span> Tips for a great username:
              </p>
              <ul className="text-xs text-yellow-700 space-y-1 ml-6 list-disc">
                <li>3-20 characters long</li>
                <li>Only letters, numbers, underscores (_), and hyphens (-)</li>
                <li>Make it fun and unique!</li>
              </ul>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving || isChecking || !!error || !newUsername.trim()}
            className="w-full h-12 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span> Saving your awesome username...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>🚀</span> Let's Go!
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

