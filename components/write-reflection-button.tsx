"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PenTool, CheckCircle } from "lucide-react"
import ReflectionModal from "./reflection-modal"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

interface WriteReflectionButtonProps {
  goalId: string
  goalText: string
  progress: number // Progress percentage (0-100)
  className?: string
}

export default function WriteReflectionButton({
  goalId,
  goalText,
  progress,
  className = "",
}: WriteReflectionButtonProps) {
  const { user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [hasReflection, setHasReflection] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check if user has already written a reflection for this goal
  useEffect(() => {
    const checkExistingReflection = async () => {
      if (!user || !goalId) return

      try {
        const { data, error } = await supabase
          .from("reflections")
          .select("id")
          .eq("user_id", user.id)
          .eq("goal_id", goalId)
          .limit(1)

        if (error) {
          console.error("Error checking reflection:", error)
          return
        }

        setHasReflection(data && data.length > 0)
      } catch (err) {
        console.error("Error checking reflection:", err)
      } finally {
        setLoading(false)
      }
    }

    checkExistingReflection()
  }, [user, goalId])

  const handleReflectionSaved = () => {
    setHasReflection(true)
  }

  // Only show button if goal is 100% complete
  if (progress < 100) {
    return null
  }

  if (loading) {
    return null
  }

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className={`${
          hasReflection
            ? "bg-green-500 hover:bg-green-600 text-white"
            : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
        } font-semibold transition-all duration-200 transform hover:scale-105 ${className}`}
        disabled={loading}
      >
        {hasReflection ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            View Reflection
          </>
        ) : (
          <>
            <PenTool className="w-4 h-4 mr-2" />
            Write Reflection
          </>
        )}
      </Button>

      <ReflectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        goalId={goalId}
        goalText={goalText}
        onReflectionSaved={handleReflectionSaved}
      />
    </>
  )
}
