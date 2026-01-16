"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/protected-route"
import GoalCard from "@/components/goal-card"
import Navigation from "@/components/navigation"
import { Loader2 } from "lucide-react"

export default function GoalsPage() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGoals = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("goal")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setGoals(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchGoals()
  }, [user])

  return (
    <ProtectedRoute>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Goals</h1>
            <p className="text-gray-600">Track your progress and write reflections when you complete goals</p>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
              Error: {error}
            </div>
          )}

          {!loading && !error && goals.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No goals found. Start by creating your first goal!</p>
            </div>
          )}

          {!loading && !error && goals.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
