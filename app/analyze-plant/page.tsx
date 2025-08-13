"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import { ArrowLeft, Camera, Upload, Loader2, Save, AlertCircle, CheckCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface AnalysisResult {
  question: string
  response: string
  imageUrl: string
  timestamp: string
}

export default function AnalyzePlantPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [question, setQuestion] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data:image/jpeg;base64, prefix
        const base64 = result.split(",")[1]
        resolve(base64)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  // Handle file selection (camera or gallery)
  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please select an image file",
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Please select an image smaller than 10MB",
      })
      return
    }

    try {
      const imageUrl = URL.createObjectURL(file)
      setSelectedImage(imageUrl)
      setSelectedFile(file)
      setAnalysisResult(null) // Clear previous analysis
    } catch (error) {
      console.error("Error processing image:", error)
      toast({
        variant: "destructive",
        title: "Image Processing Error",
        description: "Please try again",
      })
    }
  }

  // Handle camera capture
  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Handle gallery upload
  const handleGalleryUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Analyze plant with AI (mock implementation for demo)
  const analyzeWithAI = async () => {
    if (!selectedImage || !selectedFile) {
      toast({
        variant: "destructive",
        title: "No Image",
        description: "Please select an image first",
      })
      return
    }

    setIsAnalyzing(true)

    try {
      // Prepare the question
      const analysisQuestion =
        question.trim() ||
        "Analyze this marijuana plant for nutrient deficiencies, potential infections, pests, and provide suggestions for care, feeding, or treatment. Be specific and actionable."

      // For demo purposes, we'll simulate the API call with a mock response
      // In production, you would uncomment the real API call below

      // Mock response for demo
      await new Promise((resolve) => setTimeout(resolve, 3000)) // Simulate API delay

      const mockAnalysis = `# Plant Health Analysis

## Overall Assessment
Based on the image provided, here's my analysis of your cannabis plant:

## Key Observations
- **Leaf Color**: The leaves appear to have a healthy green color overall
- **Growth Pattern**: Plant structure looks normal for its stage
- **Environmental Stress**: No obvious signs of heat or light stress

## Potential Issues Identified
1. **Slight Nutrient Deficiency**: Some yellowing on lower leaves suggests possible nitrogen deficiency
2. **Watering**: Check soil moisture levels - ensure proper drainage

## Recommendations
### Immediate Actions:
- **Feeding**: Consider a balanced NPK fertilizer (20-20-20) at half strength
- **Watering**: Water when top inch of soil is dry
- **Monitoring**: Check pH levels (should be 6.0-7.0 for soil)

### Long-term Care:
- **Light Schedule**: Maintain 18/6 for vegetative stage
- **Humidity**: Keep between 40-60% RH
- **Temperature**: Maintain 70-80°F (21-27°C)

## Timeline
- **Week 1**: Apply fertilizer and monitor response
- **Week 2-3**: Look for new growth and improved leaf color
- **Ongoing**: Continue regular monitoring and feeding schedule

*Note: This analysis is for educational purposes. Always consult local laws and regulations.*`

      /* 
      // Real API call (uncomment for production):
      const base64Image = await fileToBase64(selectedFile)
      
      const response = await fetch("/api/analyze-plant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
          question: analysisQuestion,
        }),
      })

      let data
      const contentType = response.headers.get("content-type")
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
      } else {
        // Handle non-JSON response (likely an error page)
        const text = await response.text()
        console.error("Non-JSON response:", text)
        throw new Error("Server returned an invalid response. Please try again.")
      }

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      const mockAnalysis = data.analysis
      */

      const result: AnalysisResult = {
        question: analysisQuestion,
        response: mockAnalysis,
        imageUrl: selectedImage,
        timestamp: new Date().toISOString(),
      }

      setAnalysisResult(result)

      toast({
        title: "Analysis Complete",
        description: "Your plant has been analyzed successfully",
      })
    } catch (error) {
      console.error("Analysis error:", error)
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: error instanceof Error ? error.message : "Please try again",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Save analysis to journal
  const saveToJournal = async () => {
    if (!analysisResult) return

    setIsSaving(true)

    try {
      // Get existing analyses from localStorage
      const existingAnalyses = JSON.parse(localStorage.getItem("plantAnalyses") || "[]")

      // Add new analysis
      const newAnalysis = {
        ...analysisResult,
        id: Date.now().toString(),
      }

      existingAnalyses.unshift(newAnalysis)

      // Save to localStorage (limit to 50 analyses)
      localStorage.setItem("plantAnalyses", JSON.stringify(existingAnalyses.slice(0, 50)))

      toast({
        title: "Saved to Journal",
        description: "Analysis has been saved to your journal",
      })

      // Optionally redirect to journal
      setTimeout(() => {
        router.push("/journal")
      }, 1500)
    } catch (error) {
      console.error("Save error:", error)
      toast({
        variant: "destructive",
        title: "Save Error",
        description: "Please try again",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">AI Plant Analysis</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 space-y-6">
        {/* Image Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-green-600" />
              Upload Plant Image
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image Preview */}
            {selectedImage && (
              <div className="relative">
                <img
                  src={selectedImage || "/placeholder.svg"}
                  alt="Selected plant"
                  className="w-full max-w-md mx-auto rounded-lg shadow-md"
                />
              </div>
            )}

            {/* Upload Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={() => cameraInputRef.current?.click()} className="flex-1">
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
                <Upload className="mr-2 h-4 w-4" />
                Upload from Gallery
              </Button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />
          </CardContent>
        </Card>

        {/* Question Input */}
        <Card>
          <CardHeader>
            <CardTitle>Ask a Question (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="What would you like to know about this plant? e.g., 'What nutrients is this plant missing?' or 'Does this plant have any diseases?'"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground mt-2">Leave empty for a general plant health analysis</p>
          </CardContent>
        </Card>

        {/* Analyze Button */}
        <Button
          onClick={analyzeWithAI}
          disabled={!selectedImage || isAnalyzing}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Analyze with AI
            </>
          )}
        </Button>

        {/* Analysis Result */}
        {analysisResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Analysis Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Question */}
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Question:</h4>
                <p className="text-sm bg-muted p-3 rounded-md">{analysisResult.question}</p>
              </div>

              {/* AI Response */}
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">AI Analysis:</h4>
                <div className="prose prose-sm max-w-none dark:prose-invert bg-muted p-4 rounded-md">
                  <ReactMarkdown>{analysisResult.response}</ReactMarkdown>
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={saveToJournal}
                disabled={isSaving}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save to Journal
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">AI Analysis Tips</p>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Take clear, well-lit photos</li>
                  <li>• Show affected areas up close for better analysis</li>
                  <li>• Be specific in your questions for targeted advice</li>
                  <li>• AI analysis is for guidance only - consult experts for serious issues</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
