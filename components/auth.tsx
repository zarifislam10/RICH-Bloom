"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [usernameStatus, setUsernameStatus] = useState<{ available: boolean; appropriate: boolean; message: string } | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const router = useRouter()

  // Check username availability and appropriateness
  const checkUsername = async (usernameToCheck: string) => {
    if (!usernameToCheck.trim() || usernameToCheck.length < 3) {
      setUsernameStatus(null)
      return
    }

    setCheckingUsername(true)
    try {
      const res = await fetch('/api/check-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: usernameToCheck }),
      })

      const data = await res.json()
      setUsernameStatus(data)
    } catch (err) {
      console.error('Error checking username:', err)
      setUsernameStatus(null)
    } finally {
      setCheckingUsername(false)
    }
  }

  // Debounced username check
  useEffect(() => {
    if (!isLogin && username.trim().length >= 3) {
      const timer = setTimeout(() => {
        checkUsername(username)
      }, 500) // Wait 500ms after user stops typing

      return () => clearTimeout(timer)
    } else {
      setUsernameStatus(null)
    }
  }, [username, isLogin])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    // Validation
    if (!email || !password) {
      setError("Please fill in all fields")
      setLoading(false)
      return
    }

    if (!isLogin && !username.trim()) {
      setError("Please enter a username")
      setLoading(false)
      return
    }

    // Check username availability and appropriateness before signup
    if (!isLogin) {
      if (!usernameStatus || !usernameStatus.available || !usernameStatus.appropriate) {
        setError(usernameStatus?.message || "Please check your username first")
        setLoading(false)
        return
      }
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (!isLogin && password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    try {
      if (isLogin) {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setError(error.message)
        } else if (data.user) {
          setMessage("Login successful! Redirecting...")
          setTimeout(() => {
            router.push("/")
          }, 1000)
        }
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) {
          setError(error.message)
        } else if (data.user) {
          // Create profile using API route (server-side, bypasses RLS)
          try {
            const profileRes = await fetch("/api/create-profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: data.user.id,
                username: username.trim(),
              }),
            })

            const profileData = await profileRes.json()

            if (!profileRes.ok) {
              // Profile creation failed
              if (profileRes.status === 409) {
                // Username already taken
                setError("Username already taken. Please choose another.")
                await supabase.auth.signOut()
              } else {
                setError(profileData.error || "Error creating profile. Please try again.")
                await supabase.auth.signOut()
              }
            } else {
              // Profile created successfully!
              if (data.user.email_confirmed_at) {
                setMessage("Account created successfully! Redirecting...")
                setTimeout(() => {
                  router.push("/")
                }, 1000)
              } else {
                setMessage("Account created! Please check your email to confirm your account.")
              }
            }
          } catch (apiError) {
            console.error("Error calling create-profile API:", apiError)
            setError("Failed to create profile. Please try again or contact support.")
            await supabase.auth.signOut()
          }
        }
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="text-center pt-12">
          <div className="flex justify-center mb-10">
            <img 
            src="/rich-logo.svg" 
            alt="RICH Logo" 
            className="h-24 w-auto object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <p className="text-gray-600">
            {isLogin ? "Sign in to continue your goal journey" : "Join us to start tracking your goals"}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your email"
                disabled={loading}
                required
              />
            </div>

            {/* Username Field (Sign Up Only) */}
            {!isLogin && (
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                      usernameStatus
                        ? usernameStatus.available && usernameStatus.appropriate
                          ? "border-green-300 focus:ring-green-500"
                          : "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-purple-500"
                    }`}
                    placeholder="Choose a username"
                    disabled={loading || checkingUsername}
                    required
                    minLength={3}
                    maxLength={20}
                  />
                  {checkingUsername && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                {usernameStatus && (
                  <p className={`text-xs mt-1 ${
                    usernameStatus.available && usernameStatus.appropriate
                      ? "text-green-600"
                      : "text-red-600"
                  }`}>
                    {usernameStatus.message}
                  </p>
                )}
                {!usernameStatus && username.length > 0 && username.length < 3 && (
                  <p className="text-xs text-gray-500 mt-1">At least 3 characters required</p>
                )}
                {!usernameStatus && username.length >= 3 && !checkingUsername && (
                  <p className="text-xs text-gray-500 mt-1">Checking availability...</p>
                )}
              </div>
            )}

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Sign Up Only) */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Confirm your password"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            {/* Success Message */}
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? "Signing In..." : "Creating Account..."}
                </>
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>

            {/* Toggle Between Login/Sign Up */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError("")
                  setMessage("")
                  setUsername("")
                  setPassword("")
                  setConfirmPassword("")
                }}
                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                disabled={loading}
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
