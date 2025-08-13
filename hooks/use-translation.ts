"use client"

import { useState, useEffect } from "react"

type Language = "en" | "es"

interface Translations {
  [key: string]: string | Translations
}

const translations: Record<Language, Translations> = {
  en: {
    analyzePlant: {
      title: "AI Plant Analysis",
      uploadImage: "Upload Plant Image",
      takePhoto: "Take Photo",
      uploadFromGallery: "Upload from Gallery",
      askQuestion: "Ask a Question (Optional)",
      questionPlaceholder:
        "What would you like to know about this plant? e.g., 'What nutrients is this plant missing?' or 'Does this plant have any diseases?'",
      questionHint: "Leave empty for a general plant health analysis",
      analyzing: "Analyzing...",
      analyzeWithAI: "Analyze with AI",
      analysisResult: "Analysis Result",
      question: "Question:",
      aiResponse: "AI Analysis:",
      saving: "Saving...",
      saveToJournal: "Save to Journal",
      tipTitle: "AI Analysis Tips",
      tip1: "Take clear, well-lit photos",
      tip2: "Show affected areas up close for better analysis",
      tip3: "Be specific in your questions for targeted advice",
      tip4: "AI analysis is for guidance only - consult experts for serious issues",
    },
    error: {
      invalidFile: "Invalid File",
      pleaseSelectImage: "Please select a valid image file",
      fileTooLarge: "File Too Large",
      maxFileSize: "Maximum file size is 10MB",
      imageProcessing: "Image Processing Error",
      tryAgain: "Please try again",
      noImage: "No Image Selected",
      analysisError: "Analysis Error",
      saveError: "Save Error",
    },
    success: {
      analysisComplete: "Analysis Complete",
      analysisCompleteDesc: "Your plant has been analyzed successfully",
      savedToJournal: "Saved to Journal",
      savedToJournalDesc: "Analysis has been saved to your journal",
    },
  },
  es: {
    analyzePlant: {
      title: "Análisis de Planta con IA",
      uploadImage: "Subir Imagen de Planta",
      takePhoto: "Tomar Foto",
      uploadFromGallery: "Subir desde Galería",
      askQuestion: "Hacer una Pregunta (Opcional)",
      questionPlaceholder:
        "¿Qué te gustaría saber sobre esta planta? ej., '¿Qué nutrientes le faltan a esta planta?' o '¿Esta planta tiene alguna enfermedad?'",
      questionHint: "Deja vacío para un análisis general de salud de la planta",
      analyzing: "Analizando...",
      analyzeWithAI: "Analizar con IA",
      analysisResult: "Resultado del Análisis",
      question: "Pregunta:",
      aiResponse: "Análisis de IA:",
      saving: "Guardando...",
      saveToJournal: "Guardar en Diario",
      tipTitle: "Consejos para el Análisis con IA",
      tip1: "Toma fotos claras y bien iluminadas",
      tip2: "Muestra las áreas afectadas de cerca para un mejor análisis",
      tip3: "Sé específico en tus preguntas para obtener consejos dirigidos",
      tip4: "El análisis de IA es solo para orientación - consulta expertos para problemas serios",
    },
    error: {
      invalidFile: "Archivo Inválido",
      pleaseSelectImage: "Por favor selecciona un archivo de imagen válido",
      fileTooLarge: "Archivo Demasiado Grande",
      maxFileSize: "El tamaño máximo del archivo es 10MB",
      imageProcessing: "Error al Procesar Imagen",
      tryAgain: "Por favor intenta de nuevo",
      noImage: "No se Seleccionó Imagen",
      analysisError: "Error de Análisis",
      saveError: "Error al Guardar",
    },
    success: {
      analysisComplete: "Análisis Completo",
      analysisCompleteDesc: "Tu planta ha sido analizada exitosamente",
      savedToJournal: "Guardado en Diario",
      savedToJournalDesc: "El análisis ha sido guardado en tu diario",
    },
  },
}

export function useTranslation() {
  const [language, setLanguage] = useState<Language>("es") // Default to Spanish

  useEffect(() => {
    // Get language from localStorage or browser
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "es")) {
      setLanguage(savedLanguage)
    } else {
      // Detect browser language
      const browserLang = navigator.language.toLowerCase()
      if (browserLang.startsWith("en")) {
        setLanguage("en")
      } else {
        setLanguage("es")
      }
    }
  }, [])

  const t = (key: string, fallback?: string): string => {
    const keys = key.split(".")
    let value: any = translations[language]

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k]
      } else {
        return fallback || key
      }
    }

    return typeof value === "string" ? value : fallback || key
  }

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage)
    localStorage.setItem("language", newLanguage)
  }

  return {
    language,
    t,
    changeLanguage,
  }
}
