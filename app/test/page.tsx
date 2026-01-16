"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"

export default function ViewGoalsPage() {
  const { user } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGoals = async () => {
      if (!user) return

      const { data: goals, error } = await supabase.from("goal").select("*").eq("user_id", user.id) // Filter by current user instead of guest-mode

      if (error) {
        setError(error.message)
      } else {
        setData(goals || [])
      }
      setLoading(false)
    }

    fetchGoals()
  }, [user])

  return (
    <ProtectedRoute>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">📋 Your Saved Goals</h1>
        {error && <p className="text-red-500">Error: {error}</p>}
        {loading && <p>Loading...</p>}
        {!loading && data.length === 0 && <p>No goals found.</p>}
        {!loading && data.length > 0 && (
          <ul className="space-y-2 list-disc pl-6">
            {data.map((goal: any) => (
              <li key={goal.id}>
                <strong>{goal.principle}</strong>: {goal.goal_text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </ProtectedRoute>
  )
}
