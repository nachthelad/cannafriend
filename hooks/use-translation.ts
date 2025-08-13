"use client"

import { useState, useEffect } from "react"

interface Translations {
  [key: string]: string
}

const translations: { [lang: string]: Translations } = {
  en: {
    "analyzePlant.title": "AI Plant Analysis",
    "analyzePlant.uploadImage": "Upload Plant Image",
    "analyzePlant.takePhoto": "Take Photo",
    "analyzePlant.uploadFromGallery": "Upload from Gallery",
    "analyzePlant.askQuestion": "Ask a Question (Optional)",
    "analyzePlant.questionPlaceholder":
      "What would you like to know about this plant? e.g., 'What nutrients is this plant missing?' or 'Does this plant have any diseases?'",
    "analyzePlant.questionHint": "Leave empty for a general plant health analysis",
    "analyzePlant.analyzing": "Analyzing...",
    "analyzePlant.analyzeWithAI": "Analyze with AI",
    "analyzePlant.analysisResult": "Analysis Result",
    "analyzePlant.question": "Question:",
    "analyzePlant.aiResponse": "AI Analysis:",
    "analyzePlant.saving": "Saving...",
    "analyzePlant.saveToJournal": "Save to Journal",
    "analyzePlant.tipTitle": "AI Analysis Tips",
    "analyzePlant.tip1": "Take clear, well-lit photos",
    "analyzePlant.tip2": "Show affected areas up close for better analysis",
    "analyzePlant.tip3": "Be specific in your questions for targeted advice",
    "analyzePlant.tip4": "AI analysis is for guidance only - consult experts for serious issues",
    "error.invalidFile": "Invalid File",
    "error.pleaseSelectImage": "Please select an image file",
    "error.fileTooLarge": "File Too Large",
    "error.maxFileSize": "Please select an image smaller than 10MB",
    "error.imageProcessing": "Image Processing Error",
    "error.tryAgain": "Please try again",
    "error.noImage": "No Image",
    "error.analysisError": "Analysis Error",
    "error.saveError": "Save Error",
    "success.analysisComplete": "Analysis Complete",
    "success.analysisCompleteDesc": "Your plant has been analyzed successfully",
    "success.savedToJournal": "Saved to Journal",
    "success.savedToJournalDesc": "Analysis has been saved to your journal",
  },
  es: {
    "analyzePlant.title": "Análisis de Planta con IA",
    "analyzePlant.uploadImage": "Subir Imagen de Planta",
    "analyzePlant.takePhoto": "Tomar Foto",
    "analyzePlant.uploadFromGallery": "Subir desde Galería",
    "analyzePlant.askQuestion": "Hacer una Pregunta (Opcional)",
    "analyzePlant.questionPlaceholder":
      "¿Qué te gustaría saber sobre esta planta? ej., '¿Qué nutrientes le faltan a esta planta?' o '¿Tiene alguna enfermedad?'",
    "analyzePlant.questionHint": "Dejar vacío para un análisis general de salud de la planta",
    "analyzePlant.analyzing": "Analizando...",
    "analyzePlant.analyzeWithAI": "Analizar con IA",
    "analyzePlant.analysisResult": "Resultado del Análisis",
    "analyzePlant.question": "Pregunta:",
    "analyzePlant.aiResponse": "Análisis de IA:",
    "analyzePlant.saving": "Guardando...",
    "analyzePlant.saveToJournal": "Guardar en Diario",
    "analyzePlant.tipTitle": "Consejos para Análisis con IA",
    "analyzePlant.tip1": "Toma fotos claras y bien iluminadas",
    "analyzePlant.tip2": "Muestra las áreas afectadas de cerca para mejor análisis",
    "analyzePlant.tip3": "Sé específico en tus preguntas para consejos dirigidos",
    "analyzePlant.tip4": "El análisis de IA es solo para orientación - consulta expertos para problemas serios",
    "error.invalidFile": "Archivo Inválido",
    "error.pleaseSelectImage": "Por favor selecciona un archivo de imagen",
    "error.fileTooLarge": "Archivo Muy Grande",
    "error.maxFileSize": "Por favor selecciona una imagen menor a 10MB",
    "error.imageProcessing": "Error de Procesamiento de Imagen",
    "error.tryAgain": "Por favor intenta de nuevo",
    "error.noImage": "Sin Imagen",
    "error.analysisError": "Error de Análisis",
    "error.saveError": "Error al Guardar",
    "success.analysisComplete": "Análisis Completo",
    "success.analysisCompleteDesc": "Tu planta ha sido analizada exitosamente",
    "success.savedToJournal": "Guardado en Diario",
    "success.savedToJournalDesc": "El análisis ha sido guardado en tu diario",
  },
}

export function useTranslation() {
  const [language, setLanguage] = useState("es") // Default to Spanish

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("language") || "es"
      setLanguage(savedLanguage)
    }
  }, [])

  const t = (key: string, fallback?: string): string => {
    return translations[language]?.[key] || fallback || key
  }

  const changeLanguage = (newLanguage: string) => {
    setLanguage(newLanguage)
    if (typeof window !== "undefined") {
      localStorage.setItem("language", newLanguage)
    }
  }

  return { t, language, changeLanguage }
}
