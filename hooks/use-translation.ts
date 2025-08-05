"use client"

import { useState, useEffect } from "react"

type Language = "es" | "en"

interface Translations {
  [key: string]: {
    [key: string]: string
  }
}

const translations: Translations = {
  es: {
    // App
    "app.name": "Cannabis Grow Tracker",
    "app.description": "Rastrea el crecimiento de tus plantas",

    // Auth
    "auth.signIn": "Iniciar Sesión",
    "auth.signUp": "Registrarse",
    "auth.signInDesc": "Inicia sesión en tu cuenta",
    "auth.signUpDesc": "Crea una nueva cuenta",
    "auth.email": "Correo Electrónico",
    "auth.emailPlaceholder": "tu@email.com",
    "auth.password": "Contraseña",
    "auth.passwordPlaceholder": "Tu contraseña",
    "auth.googleSignIn": "Continuar con Google",
    "auth.demoMode": "🚀 Modo Demo (Solo Prueba)",
    "auth.needAccount": "¿No tienes cuenta? Regístrate",
    "auth.haveAccount": "¿Ya tienes cuenta? Inicia sesión",
    "auth.loading": "Cargando...",
    "auth.error": "Error de autenticación",
    "auth.or": "o",

    // Dashboard
    "dashboard.title": "Panel Principal",
    "dashboard.addPlant": "Agregar Planta",
    "dashboard.noPlants": "No tienes plantas aún",
    "dashboard.noPlantDesc": "Comienza agregando tu primera planta",
    "dashboard.error": "Error al cargar plantas",

    // Navigation
    "nav.dashboard": "Panel",
    "nav.plants": "Plantas",
    "nav.journal": "Diario",
    "nav.settings": "Configuración",

    // Plants
    "plants.name": "Nombre",
    "plants.strain": "Cepa",
    "plants.seedType": "Tipo de Semilla",
    "plants.growType": "Tipo de Cultivo",
    "plants.plantingDate": "Fecha de Plantación",
    "plants.stage": "Etapa",
    "plants.indoor": "Interior",
    "plants.outdoor": "Exterior",
    "plants.autoflower": "Autofloreciente",
    "plants.feminized": "Feminizada",
    "plants.regular": "Regular",
    "plants.seedling": "Plántula",
    "plants.vegetative": "Vegetativo",
    "plants.flowering": "Floración",
    "plants.harvest": "Cosecha",

    // Settings
    "settings.title": "Configuración",
    "settings.language": "Idioma",
    "settings.timezone": "Zona Horaria",
    "settings.theme": "Tema",
    "settings.account": "Cuenta",
    "settings.deleteAccount": "Eliminar Cuenta",
    "settings.save": "Guardar",

    // Common
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.delete": "Eliminar",
    "common.edit": "Editar",
    "common.loading": "Cargando...",
    "common.error": "Error",
    "common.success": "Éxito",
  },
  en: {
    // App
    "app.name": "Cannabis Grow Tracker",
    "app.description": "Track your plant growth",

    // Auth
    "auth.signIn": "Sign In",
    "auth.signUp": "Sign Up",
    "auth.signInDesc": "Sign in to your account",
    "auth.signUpDesc": "Create a new account",
    "auth.email": "Email",
    "auth.emailPlaceholder": "your@email.com",
    "auth.password": "Password",
    "auth.passwordPlaceholder": "Your password",
    "auth.googleSignIn": "Continue with Google",
    "auth.demoMode": "🚀 Demo Mode (Test Only)",
    "auth.needAccount": "Don't have an account? Sign up",
    "auth.haveAccount": "Already have an account? Sign in",
    "auth.loading": "Loading...",
    "auth.error": "Authentication error",
    "auth.or": "or",

    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.addPlant": "Add Plant",
    "dashboard.noPlants": "You don't have any plants yet",
    "dashboard.noPlantDesc": "Start by adding your first plant",
    "dashboard.error": "Error loading plants",

    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.plants": "Plants",
    "nav.journal": "Journal",
    "nav.settings": "Settings",

    // Plants
    "plants.name": "Name",
    "plants.strain": "Strain",
    "plants.seedType": "Seed Type",
    "plants.growType": "Grow Type",
    "plants.plantingDate": "Planting Date",
    "plants.stage": "Stage",
    "plants.indoor": "Indoor",
    "plants.outdoor": "Outdoor",
    "plants.autoflower": "Autoflower",
    "plants.feminized": "Feminized",
    "plants.regular": "Regular",
    "plants.seedling": "Seedling",
    "plants.vegetative": "Vegetative",
    "plants.flowering": "Flowering",
    "plants.harvest": "Harvest",

    // Settings
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.timezone": "Timezone",
    "settings.theme": "Theme",
    "settings.account": "Account",
    "settings.deleteAccount": "Delete Account",
    "settings.save": "Save",

    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
  },
}

export function useTranslation() {
  const [language, setLanguage] = useState<Language>("es")

  useEffect(() => {
    // Check if we're on the client side
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("language") as Language
      if (savedLanguage && (savedLanguage === "es" || savedLanguage === "en")) {
        setLanguage(savedLanguage)
      }
    }
  }, [])

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage)
    if (typeof window !== "undefined") {
      localStorage.setItem("language", newLanguage)
    }
  }

  const t = (key: string): string => {
    const keys = key.split(".")
    let value: any = translations[language]

    for (const k of keys) {
      value = value?.[k]
    }

    return value || key
  }

  return { t, language, changeLanguage }
}
