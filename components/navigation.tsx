"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Target, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function Navigation() {
  const { user, username, signOut } = useAuth()

  return (
    <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              
              <span className="text-xl font-bold text-gray-900">RICH bloom</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="text-gray-700 hover:text-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Goal
                </Button>
              </Link>
              <Link href="/goals">
                <Button variant="ghost" className="text-gray-700 hover:text-purple-600">
                  
                  My Goals
                </Button>
              </Link>
            </div>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                Welcome, {username || user.email?.split('@')[0] || 'User'}
              </span>
              <Button onClick={signOut} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
} 