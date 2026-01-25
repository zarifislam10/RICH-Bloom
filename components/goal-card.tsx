"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import WriteReflectionButton from "./write-reflection-button"
import { Edit, Save, X } from "lucide-react"

interface GoalCardProps {
  goal: {
    id: string
    goal_text: string
    principle: string
    progress?: number
    created_at: string
  }
}

export default function GoalCard({ goal }: GoalCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Progress is read-only - only updated by Google Classroom integration
  const progress = goal.progress || 0

  const getPrincipleColor = (principle: string) => {
    switch (principle?.toLowerCase()) {
      case "i matter":
        return "text-blue-600 bg-blue-50 border-blue-200"
      case "responsibility":
        return "text-red-600 bg-red-50 border-red-200"
      case "considerate":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "strategies":
        return "text-green-600 bg-green-50 border-green-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const handleLinkToAssignment = async () => {
    setIsSaving(true)
    try {
      // TODO: Implement Google Classroom API integration
      // This will link the goal to a Google Classroom assignment
      // and automatically track progress based on assignment completion
      alert("Google Classroom integration coming soon!")
      setIsEditOpen(false)
    } catch (err) {
      console.error("Error linking to assignment:", err)
      alert("Error linking to assignment")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-semibold text-gray-800 line-clamp-2">{goal.goal_text}</CardTitle>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPrincipleColor(goal.principle)}`}>
              {goal.principle}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar (Read-Only) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Progress</span>
              <span className="text-sm font-bold text-gray-800">{progress}%</span>
            </div>
            
            {/* Visual Progress Bar - Updated automatically by Google Classroom */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  progress === 100
                    ? "bg-gradient-to-r from-green-400 to-green-600"
                    : "bg-gradient-to-r from-blue-400 to-purple-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Progress updates automatically when you submit assignments in Google Classroom
            </p>
          </div>

          {/* Completion Status and Reflection Button */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Created {new Date(goal.created_at).toLocaleDateString()}</span>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsEditOpen(true)}
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-purple-600"
              >
                <Edit className="w-4 h-4 mr-1" />
                Link to Assignment
              </Button>
              
              {progress === 100 && <WriteReflectionButton goalId={goal.id} goalText={goal.goal_text} progress={progress} />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Link to Assignment Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Link to Google Classroom Assignment
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Link this goal to a Google Classroom assignment to automatically track progress based on assignment completion.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Coming Soon:</strong> Google Classroom API integration will automatically update goal progress when assignments are completed.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleLinkToAssignment}
                disabled={isSaving}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Save className="w-4 h-4 mr-1" />
                {isSaving ? "Linking..." : "Link Assignment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
