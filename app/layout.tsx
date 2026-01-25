import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import SetUsernameModal from "@/components/set-username-modal"

export const metadata: Metadata = {
  title: "RICH Goal Tracker",
  description: "Track your goals with RICH principles",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <SetUsernameModal />
        </AuthProvider>
      </body>
    </html>
  )
}
