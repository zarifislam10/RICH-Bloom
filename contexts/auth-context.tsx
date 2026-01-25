"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  username: string | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  username: null,
  loading: true,
  signOut: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Fetch username from user_profiles table (non-blocking)
  const fetchUsername = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('user_id', userId)
        .maybeSingle() // Use maybeSingle() instead of single() - returns null if no row found instead of error

      if (error) {
        // Only log actual errors, not "no rows found"
        if (error.code !== 'PGRST116') {
          console.error("Error fetching username:", error)
        }
        setUsername(null)
      } else {
        setUsername(data?.username || null)
      }
    } catch (err) {
      console.error("Error fetching username:", err)
      setUsername(null)
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      // Set loading to false immediately so pages can render
      setLoading(false)
      
      // Fetch username in background (non-blocking)
      if (session?.user) {
        fetchUsername(session.user.id).catch(() => {
          // Silently handle errors - username will just be null
          setUsername(null)
        })
      } else {
        setUsername(null)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      
      // Set loading to false immediately
      setLoading(false)
      
      // Fetch username in background (non-blocking)
      if (session?.user) {
        fetchUsername(session.user.id).catch(() => {
          // Silently handle errors - username will just be null
          setUsername(null)
        })
      } else {
        setUsername(null)
      }

      if (event === "SIGNED_IN") {
        router.push("/")
      } else if (event === "SIGNED_OUT") {
        router.push("/login")
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return <AuthContext.Provider value={{ user, username, loading, signOut }}>{children}</AuthContext.Provider>
}
