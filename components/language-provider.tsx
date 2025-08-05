"use client"

import { createContext, useState, useEffect, type ReactNode } from "react"

type Language = "es" | "en"

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
}

export const LanguageContext = createContext<LanguageContextType>({
  language: "es",
  setLanguage: () => {},
  t: () => "",
})

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>("es")
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({})
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load translations
    const loadTranslations = async () => {
      const esTranslations = {
        "app.name": "Seguimiento de Cultivo",
        "app.description": "Seguimiento de crecimiento de plantas",

        // Login/Signup
        "login.title": "Iniciar Sesión",
        "login.email": "Correo Electrónico",
        "login.password": "Contraseña",
        "login.submit": "Iniciar Sesión",
        "login.loading": "Iniciando sesión...",
        "login.error": "Error al iniciar sesión",
        "login.or": "o continuar con",
        "login.google": "Continuar con Google",
        "login.terms": "Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad",
        "login.demoMode": "Modo Demo (Solo Prueba)",

        "signup.title": "Registrarse",
        "signup.email": "Correo Electrónico",
        "signup.password": "Contraseña",
        "signup.submit": "Registrarse",
        "signup.loading": "Registrando...",
        "signup.error": "Error al registrarse",

        // Onboarding
        "onboarding.title": "Bienvenido",
        "onboarding.description": "Configura tu cuenta para comenzar",
        "onboarding.timezone": "Zona Horaria",
        "onboarding.selectTimezone": "Selecciona tu zona horaria",
        "onboarding.submit": "Continuar",
        "onboarding.loading": "Guardando...",
        "onboarding.success": "¡Configuración guardada!",
        "onboarding.successMessage": "Tu cuenta ha sido configurada correctamente",
        "onboarding.error": "Error al guardar la configuración",
        "onboarding.info": "Esta información nos ayuda a mostrar fechas y recordatorios en tu zona horaria",

        // Dashboard
        "dashboard.title": "Panel de Control",
        "dashboard.addPlant": "Agregar Planta",
        "dashboard.noPlants": "No tienes plantas",
        "dashboard.noPlantDesc": "Agrega tu primera planta para comenzar a hacer seguimiento",
        "dashboard.error": "Error al cargar las plantas",

        // New Plant
        "newPlant.title": "Agregar Nueva Planta",
        "newPlant.description": "Ingresa los detalles de tu planta",
        "newPlant.name": "Nombre",
        "newPlant.strain": "Variedad",
        "newPlant.selectStrain": "Selecciona una variedad",
        "newPlant.seedType": "Tipo de Semilla",
        "newPlant.autoflower": "Autofloreciente",
        "newPlant.feminized": "Feminizada",
        "newPlant.regular": "Regular",
        "newPlant.growType": "Tipo de Cultivo",
        "newPlant.indoor": "Interior",
        "newPlant.outdoor": "Exterior",
        "newPlant.plantingDate": "Fecha de Plantación",
        "newPlant.pickDate": "Selecciona una fecha",
        "newPlant.lightSchedule": "Ciclo de Luz",
        "newPlant.selectLightSchedule": "Selecciona un ciclo de luz",
        "newPlant.vegetative": "Vegetativo",
        "newPlant.flowering": "Floración",
        "newPlant.submit": "Guardar Planta",
        "newPlant.loading": "Guardando...",
        "newPlant.success": "¡Planta agregada!",
        "newPlant.successMessage": "Tu planta ha sido agregada correctamente",
        "newPlant.error": "Error al agregar la planta",

        // Plant Page
        "plantPage.details": "Detalles",
        "plantPage.journal": "Diario",
        "plantPage.environment": "Ambiente",
        "plantPage.photos": "Fotos",
        "plantPage.notFound": "Planta no encontrada",
        "plantPage.notFoundDesc": "La planta que buscas no existe o ha sido eliminada",
        "plantPage.backToDashboard": "Volver al Panel",
        "plantPage.error": "Error al cargar la planta",
        "plantPage.addLog": "Agregar Registro",
        "plantPage.addLogDesc": "Registra una actividad o medición",
        "plantPage.recentLogs": "Registros Recientes",
        "plantPage.recentLogsDesc": "Últimas actividades registradas",
        "plantPage.environmentData": "Datos Ambientales",
        "plantPage.environmentDataDesc": "Temperatura, humedad y pH",
        "plantPage.photoGallery": "Galería de Fotos",
        "plantPage.photoGalleryDesc": "Fotos de tu planta",
        "plantPage.uploadPhoto": "Subir Foto",
        "plantPage.uploading": "Subiendo...",
        "plantPage.photoSuccess": "¡Foto subida!",
        "plantPage.photoSuccessDesc": "Tu foto ha sido subida correctamente",
        "plantPage.photoError": "Error al subir la foto",
        "plantPage.analyzePhoto": "Analizar Foto",
        "plantPage.analyzing": "Analizando...",

        // Settings
        "settings.title": "Configuración",
        "settings.preferences": "Preferencias",
        "settings.preferencesDesc": "Personaliza tu experiencia",
        "settings.language": "Idioma",
        "settings.timezone": "Zona Horaria",
        "settings.selectTimezone": "Selecciona tu zona horaria",
        "settings.darkMode": "Modo Oscuro",
        "settings.timezoneUpdated": "Zona horaria actualizada",
        "settings.timezoneUpdatedDesc": "Tu zona horaria ha sido actualizada correctamente",
        "settings.darkModeUpdated": "Modo oscuro actualizado",
        "settings.darkModeOn": "Modo oscuro activado",
        "settings.darkModeOff": "Modo oscuro desactivado",
        "settings.error": "Error al guardar la configuración",
        "settings.dangerZone": "Zona de Peligro",
        "settings.dangerZoneDesc": "Acciones irreversibles",
        "settings.deleteAccount": "Eliminar Cuenta",
        "settings.confirmDelete": "¿Estás seguro?",
        "settings.confirmDeleteDesc":
          "Esta acción no se puede deshacer. Todos tus datos serán archivados y tu cuenta será eliminada permanentemente.",
        "settings.cancel": "Cancelar",
        "settings.confirmDeleteButton": "Sí, eliminar mi cuenta",
        "settings.deleting": "Eliminando...",
        "settings.accountDeleted": "Cuenta eliminada",
        "settings.accountDeletedDesc": "Tu cuenta ha sido eliminada correctamente",
        "settings.deleteError": "Error al eliminar la cuenta",

        // Navigation
        "nav.dashboard": "Panel de Control",
        "nav.addPlant": "Agregar Planta",
        "nav.journal": "Diario",
        "nav.settings": "Configuración",
        "nav.signOut": "Cerrar Sesión",

        // Journal
        "journal.title": "Diario de Cultivo",
        "journal.loading": "Cargando registros...",
        "journal.noEntries": "No hay registros",
        "journal.noEntriesDesc": "Agrega un registro para comenzar a hacer seguimiento",
        "journal.error": "Error al cargar los registros",

        // Log Types
        "logType.watering": "Riego",
        "logType.feeding": "Fertilización",
        "logType.training": "Entrenamiento",
        "logType.environment": "Ambiente",
        "logType.note": "Nota",

        // Log Form
        "logForm.type": "Tipo de Registro",
        "logForm.date": "Fecha",
        "logForm.notes": "Notas",
        "logForm.submit": "Guardar Registro",
        "logForm.loading": "Guardando...",
        "logForm.success": "¡Registro guardado!",
        "logForm.error": "Error al guardar el registro",

        // Watering
        "watering.amount": "Cantidad (ml)",
        "watering.method": "Método",
        "watering.topWatering": "Riego Superior",
        "watering.bottomWatering": "Riego Inferior",
        "watering.drip": "Goteo",

        // Feeding
        "feeding.type": "Tipo de Fertilizante",
        "feeding.npk": "Proporción NPK",
        "feeding.amount": "Cantidad (ml/L)",
        "feeding.organic": "Orgánico",
        "feeding.synthetic": "Sintético",

        // Training
        "training.method": "Método",
        "training.topping": "Topping",
        "training.lst": "LST (Entrenamiento de Bajo Estrés)",
        "training.defoliation": "Defoliación",
        "training.supercropping": "Supercropping",

        // Environment
        "environment.temperature": "Temperatura (°C)",
        "environment.humidity": "Humedad (%)",
        "environment.ph": "pH",
        "environment.light": "Intensidad de Luz",
        "environment.ppfd": "PPFD (μmol/m²/s)",
        "environment.hours": "Horas de Luz",
      }

      const enTranslations = {
        "app.name": "Grow Tracker",
        "app.description": "Track your plant growth",

        // Login/Signup
        "login.title": "Login",
        "login.email": "Email",
        "login.password": "Password",
        "login.submit": "Sign In",
        "login.loading": "Signing in...",
        "login.error": "Login error",
        "login.or": "or continue with",
        "login.google": "Continue with Google",
        "login.terms": "By continuing, you agree to our Terms of Service and Privacy Policy",
        "login.demoMode": "Demo Mode (Test Only)",

        "signup.title": "Sign Up",
        "signup.email": "Email",
        "signup.password": "Password",
        "signup.submit": "Sign Up",
        "signup.loading": "Signing up...",
        "signup.error": "Sign up error",

        // Onboarding
        "onboarding.title": "Welcome",
        "onboarding.description": "Set up your account to get started",
        "onboarding.timezone": "Timezone",
        "onboarding.selectTimezone": "Select your timezone",
        "onboarding.submit": "Continue",
        "onboarding.loading": "Saving...",
        "onboarding.success": "Settings saved!",
        "onboarding.successMessage": "Your account has been set up successfully",
        "onboarding.error": "Error saving settings",
        "onboarding.info": "This information helps us display dates and reminders in your timezone",

        // Dashboard
        "dashboard.title": "Dashboard",
        "dashboard.addPlant": "Add Plant",
        "dashboard.noPlants": "No plants",
        "dashboard.noPlantDesc": "Add your first plant to start tracking",
        "dashboard.error": "Error loading plants",

        // New Plant
        "newPlant.title": "Add New Plant",
        "newPlant.description": "Enter your plant details",
        "newPlant.name": "Name",
        "newPlant.strain": "Strain",
        "newPlant.selectStrain": "Select a strain",
        "newPlant.seedType": "Seed Type",
        "newPlant.autoflower": "Autoflower",
        "newPlant.feminized": "Feminized",
        "newPlant.regular": "Regular",
        "newPlant.growType": "Grow Type",
        "newPlant.indoor": "Indoor",
        "newPlant.outdoor": "Outdoor",
        "newPlant.plantingDate": "Planting Date",
        "newPlant.pickDate": "Pick a date",
        "newPlant.lightSchedule": "Light Schedule",
        "newPlant.selectLightSchedule": "Select a light schedule",
        "newPlant.vegetative": "Vegetative",
        "newPlant.flowering": "Flowering",
        "newPlant.submit": "Save Plant",
        "newPlant.loading": "Saving...",
        "newPlant.success": "Plant added!",
        "newPlant.successMessage": "Your plant has been added successfully",
        "newPlant.error": "Error adding plant",

        // Plant Page
        "plantPage.details": "Details",
        "plantPage.journal": "Journal",
        "plantPage.environment": "Environment",
        "plantPage.photos": "Photos",
        "plantPage.notFound": "Plant not found",
        "plantPage.notFoundDesc": "The plant you're looking for doesn't exist or has been deleted",
        "plantPage.backToDashboard": "Back to Dashboard",
        "plantPage.error": "Error loading plant",
        "plantPage.addLog": "Add Log",
        "plantPage.addLogDesc": "Record an activity or measurement",
        "plantPage.recentLogs": "Recent Logs",
        "plantPage.recentLogsDesc": "Latest recorded activities",
        "plantPage.environmentData": "Environmental Data",
        "plantPage.environmentDataDesc": "Temperature, humidity, and pH",
        "plantPage.photoGallery": "Photo Gallery",
        "plantPage.photoGalleryDesc": "Photos of your plant",
        "plantPage.uploadPhoto": "Upload Photo",
        "plantPage.uploading": "Uploading...",
        "plantPage.photoSuccess": "Photo uploaded!",
        "plantPage.photoSuccessDesc": "Your photo has been uploaded successfully",
        "plantPage.photoError": "Error uploading photo",
        "plantPage.analyzePhoto": "Analyze Photo",
        "plantPage.analyzing": "Analyzing...",

        // Settings
        "settings.title": "Settings",
        "settings.preferences": "Preferences",
        "settings.preferencesDesc": "Customize your experience",
        "settings.language": "Language",
        "settings.timezone": "Timezone",
        "settings.selectTimezone": "Select your timezone",
        "settings.darkMode": "Dark Mode",
        "settings.timezoneUpdated": "Timezone updated",
        "settings.timezoneUpdatedDesc": "Your timezone has been updated successfully",
        "settings.darkModeUpdated": "Dark mode updated",
        "settings.darkModeOn": "Dark mode enabled",
        "settings.darkModeOff": "Dark mode disabled",
        "settings.error": "Error saving settings",
        "settings.dangerZone": "Danger Zone",
        "settings.dangerZoneDesc": "Irreversible actions",
        "settings.deleteAccount": "Delete Account",
        "settings.confirmDelete": "Are you sure?",
        "settings.confirmDeleteDesc":
          "This action cannot be undone. All your data will be archived and your account will be permanently deleted.",
        "settings.cancel": "Cancel",
        "settings.confirmDeleteButton": "Yes, delete my account",
        "settings.deleting": "Deleting...",
        "settings.accountDeleted": "Account deleted",
        "settings.accountDeletedDesc": "Your account has been deleted successfully",
        "settings.deleteError": "Error deleting account",

        // Navigation
        "nav.dashboard": "Dashboard",
        "nav.addPlant": "Add Plant",
        "nav.journal": "Journal",
        "nav.settings": "Settings",
        "nav.signOut": "Sign Out",

        // Journal
        "journal.title": "Grow Journal",
        "journal.loading": "Loading logs...",
        "journal.noEntries": "No entries",
        "journal.noEntriesDesc": "Add a log to start tracking",
        "journal.error": "Error loading logs",

        // Log Types
        "logType.watering": "Watering",
        "logType.feeding": "Feeding",
        "logType.training": "Training",
        "logType.environment": "Environment",
        "logType.note": "Note",

        // Log Form
        "logForm.type": "Log Type",
        "logForm.date": "Date",
        "logForm.notes": "Notes",
        "logForm.submit": "Save Log",
        "logForm.loading": "Saving...",
        "logForm.success": "Log saved!",
        "logForm.error": "Error saving log",

        // Watering
        "watering.amount": "Amount (ml)",
        "watering.method": "Method",
        "watering.topWatering": "Top Watering",
        "watering.bottomWatering": "Bottom Watering",
        "watering.drip": "Drip",

        // Feeding
        "feeding.type": "Fertilizer Type",
        "feeding.npk": "NPK Ratio",
        "feeding.amount": "Amount (ml/L)",
        "feeding.organic": "Organic",
        "feeding.synthetic": "Synthetic",

        // Training
        "training.method": "Method",
        "training.topping": "Topping",
        "training.lst": "LST (Low Stress Training)",
        "training.defoliation": "Defoliation",
        "training.supercropping": "Supercropping",

        // Environment
        "environment.temperature": "Temperature (°C)",
        "environment.humidity": "Humidity (%)",
        "environment.ph": "pH",
        "environment.light": "Light Intensity",
        "environment.ppfd": "PPFD (μmol/m²/s)",
        "environment.hours": "Light Hours",
      }

      setTranslations({
        es: esTranslations,
        en: enTranslations,
      })

      setIsLoaded(true)
    }

    loadTranslations()

    // Check if user has a preferred language stored
    const storedLanguage = localStorage.getItem("language") as Language
    if (storedLanguage && (storedLanguage === "es" || storedLanguage === "en")) {
      setLanguage(storedLanguage)
    }
  }, [])

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem("language", language)

    // Update HTML lang attribute
    document.documentElement.lang = language
  }, [language])

  const t = (key: string): string => {
    if (!isLoaded) return key

    const currentTranslations = translations[language] || {}
    return currentTranslations[key] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}
