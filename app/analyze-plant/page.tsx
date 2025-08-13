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
        title: t("error.invalidFile"),
        description: t("error.pleaseSelectImage"),
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: t("error.fileTooLarge"),
        description: t("error.maxFileSize"),
      })
      return
    }

    try {
      const imageUrl = URL.createObjectURL(file)
      setSelectedImage(imageUrl)
      setAnalysisResult(null) // Clear previous analysis
    } catch (error) {
      console.error("Error processing image:", error)
      toast({
        variant: "destructive",
        title: t("error.imageProcessing"),
        description: t("error.tryAgain"),
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

  // Analyze plant with OpenAI
  const analyzeWithAI = async () => {
    if (!selectedImage) {
      toast({
        variant: "destructive",
        title: t("error.noImage"),
        description: t("error.pleaseSelectImage"),
      })
      return
    }

    setIsAnalyzing(true)

    try {
      // Get the file from the file input
      const fileInput = fileInputRef.current || cameraInputRef.current
      const file = fileInput?.files?.[0]

      if (!file) {
        throw new Error("No file selected")
      }

      // Convert to base64
      const base64Image = await fileToBase64(file)

      // Prepare the question
      const analysisQuestion =
        question.trim() ||
        "Analyze this marijuana plant for nutrient deficiencies, potential infections, pests, and provide suggestions for care, feeding, or treatment. Be specific and actionable."

      // Call OpenAI API
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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Analysis failed")
      }

      const data = await response.json()

      const result: AnalysisResult = {
        question: analysisQuestion,
        response: data.analysis,
        imageUrl: selectedImage,
        timestamp: new Date().toISOString(),
      }

      setAnalysisResult(result)

      toast({
        title: t("success.analysisComplete"),
        description: t("success.analysisCompleteDesc"),
      })
    } catch (error) {
      console.error("Analysis error:", error)
      toast({
        variant: "destructive",
        title: t("error.analysisError"),
        description: error instanceof Error ? error.message : t("error.tryAgain"),
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
        title: t("success.savedToJournal"),
        description: t("success.savedToJournalDesc"),
      })

      // Optionally redirect to journal
      setTimeout(() => {
        router.push("/journal")
      }, 1500)
    } catch (error) {
      console.error("Save error:", error)
      toast({
        variant: "destructive",
        title: t("error.saveError"),
        description: t("error.tryAgain"),
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
          <h1 className="text-lg font-semibold">{t("analyzePlant.title", "AI Plant Analysis")}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 space-y-6">
        {/* Image Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-green-600" />
              {t("analyzePlant.uploadImage", "Upload Plant Image")}
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
                {t("analyzePlant.takePhoto", "Take Photo")}
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
                <Upload className="mr-2 h-4 w-4" />
                {t("analyzePlant.uploadFromGallery", "Upload from Gallery")}
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
            <CardTitle>{t("analyzePlant.askQuestion", "Ask a Question (Optional)")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={t(
                "analyzePlant.questionPlaceholder",
                "What would you like to know about this plant? e.g., 'What nutrients is this plant missing?' or 'Does this plant have any diseases?'",
              )}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground mt-2">
              {t("analyzePlant.questionHint", "Leave empty for a general plant health analysis")}
            </p>
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
              {t("analyzePlant.analyzing", "Analyzing...")}
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              {t("analyzePlant.analyzeWithAI", "Analyze with AI")}
            </>
          )}
        </Button>

        {/* Analysis Result */}
        {analysisResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                {t("analyzePlant.analysisResult", "Analysis Result")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Question */}
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">
                  {t("analyzePlant.question", "Question:")}
                </h4>
                <p className="text-sm bg-muted p-3 rounded-md">{analysisResult.question}</p>
              </div>

              {/* AI Response */}
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">
                  {t("analyzePlant.aiResponse", "AI Analysis:")}
                </h4>
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
                    {t("analyzePlant.saving", "Saving...")}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t("analyzePlant.saveToJournal", "Save to Journal")}
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
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {t("analyzePlant.tipTitle", "AI Analysis Tips")}
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• {t("analyzePlant.tip1", "Take clear, well-lit photos")}</li>
                  <li>• {t("analyzePlant.tip2", "Show affected areas up close for better analysis")}</li>
                  <li>• {t("analyzePlant.tip3", "Be specific in your questions for targeted advice")}</li>
                  <li>
                    • {t("analyzePlant.tip4", "AI analysis is for guidance only - consult experts for serious issues")}
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
