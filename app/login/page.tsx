/**
 * LOGIN PAGE (Authentication)
 * Route: /login
 * 
 * This page handles user authentication:
 * - Sign in with email/password
 * - Sign up new users
 * - Uses Supabase Auth for secure authentication
 */
import Auth from "@/components/auth"

export default function LoginPage() {
  return <Auth />
}
