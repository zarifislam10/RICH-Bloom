"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { X, Send, Loader2 } from "lucide-react"

interface ReflectionModalProps {
  isOpen: boolean
  onClose: () => void
  goalId: string
  goalText: string
  onReflectionSaved: () => void
}

const RICH_PRINCIPLES = [
  { value: "I Matter", label: "I Matter", description: "Setting goals that help me value myself and build confidence" },
  { value: "Responsibility", label: "Responsibility", description: "Taking ownership of my actions and commitments" },
  { value: "Considerate", label: "Considerate", description: "Being thoughtful and kind in my interactions with others" },
  { value: "Strategies", label: "Strategies", description: "Developing smart approaches to reach my goals" },
]

export default function ReflectionModal({
  isOpen,
  onClose,
  goalId,
  goalText,
  onReflectionSaved,
}: ReflectionModalProps) {
  const { user } = useAuth()
  const [selectedPrinciple, setSelectedPrinciple] = useState("")
  const [reflectionText, setReflectionText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPrinciple || !reflectionText.trim()) {
      setError("Please select a principle and write your reflection")
      return
    }

    if (!user) {
      setError("You must be logged in to save reflections")
      return
    }

    setLoading(true)
    setError("")

    try {
      const { error: insertError } = await supabase.from("reflections").insert([
        {
          user_id: user.id,
          goal_id: goalId,
          principle: selectedPrinciple,
          reflection_text: reflectionText.trim(),
        },
      ])

      if (insertError) {
        throw insertError
      }

      // Reset form and close modal
      setSelectedPrinciple("")
      setReflectionText("")
      onReflectionSaved()
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to save reflection")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setSelectedPrinciple("")
      setReflectionText("")
      setError("")
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <button
            onClick={handleClose}
            disabled={loading}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={24} />
          </button>
          <CardTitle className="text-2xl font-bold text-gray-800 pr-8">🎯 Write Your Reflection</CardTitle>
          <p className="text-gray-600 mt-2">
            Congratulations on completing your goal! Take a moment to reflect on your journey.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Goal Display */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">Completed Goal:</h3>
            <p className="text-green-700">{goalText}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Principle Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Which RICH principle did this goal help you develop most?
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {RICH_PRINCIPLES.map((principle) => (
                  <div
                    key={principle.value}
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                      selectedPrinciple === principle.value
                        ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedPrinciple(principle.value)}
                  >
                    <div className="flex items-center mb-2">
                      <input
                        type="radio"
                        name="principle"
                        value={principle.value}
                        checked={selectedPrinciple === principle.value}
                        onChange={(e) => setSelectedPrinciple(e.target.value)}
                        className="mr-3 text-purple-600"
                        disabled={loading}
                      />
                      <span className="font-semibold text-gray-800">{principle.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">{principle.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reflection Text */}
            <div>
              <label htmlFor="reflection" className="block text-sm font-medium text-gray-700 mb-2">
                Write your reflection
              </label>
              <Textarea
                id="reflection"
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="Reflect on your journey... What did you learn? How did you grow? What challenges did you overcome?"
                className="min-h-32 resize-none"
                disabled={loading}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Share your thoughts, insights, and what this achievement means to you.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="px-6 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !selectedPrinciple || !reflectionText.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Save Reflection
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
