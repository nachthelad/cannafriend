"use client";

import { createContext, useState, useEffect, type ReactNode } from "react";

export type Language = "es" | "en";

export interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: "es",
  setLanguage: () => {},
  t: () => "",
});

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>("es");
  const [translations, setTranslations] = useState<
    Record<string, Record<string, string>>
  >({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load translations
    const loadTranslations = async () => {
      const esTranslations = {
        // Analyze Plant
        "analyzePlant.title": "Análisis con IA",
        "analyzePlant.defaultPrompt":
          "Analiza esta planta de marihuana para detectar deficiencias de nutrientes, posibles infecciones y sugerencias de cuidado o alimentación.",
        "analyzePlant.uploadImage": "Foto de la planta",
        "analyzePlant.takePhoto": "Tomar foto",
        "analyzePlant.uploadFromGallery": "Subir",
        "analyzePlant.askQuestion": "Pregunta (opcional)",
        "analyzePlant.questionPlaceholder": "Ej.: ¿Qué le falta a esta planta?",
        "analyzePlant.analyzeWithAI": "Analizar con IA",
        "analyzePlant.analysisResult": "Resultado de IA",
        "analyzePlant.journal": "Diario de Análisis IA",
        "analyzePlant.noAnalyses":
          "Aún no hay análisis. Tus resultados aparecerán aquí.",
        "analyzePlant.defaultQuestion": "Análisis general",
        "analyzePlant.viewHistory": "Ver historial",
        "analyzePlant.hideHistory": "Ocultar historial",
        // Analysis details page
        "analysis.notFound": "Análisis no encontrado",

        // Premium
        "premium.title": "Función premium",
        "premium.analyzeDesc":
          "Desbloquea el análisis con IA para diagnosticar y optimizar el cuidado.",
        "premium.upgrade": "Mejorar a Premium",
        // Premium page
        "premium.wip": "Estamos trabajando en el plan Premium.",
        "premium.mercadoPago": "Pronto podrás pagar con Mercado Pago.",
        "premium.back": "Volver al panel",

        // AI Consumer Chat
        "aiConsumer.title": "Consultale a la IA",
        "aiConsumer.intro":
          "Pregúntale sobre técnica de armado, mejorar porros, dosis, planificación de sesiones, terpenos/sabores, almacenamiento, etiqueta y reducción de daños.",
        "aiConsumer.placeholder":
          "Pregunta sobre armado, dosis, rutinas, sabores...",
        "aiConsumer.send": "Enviar",
        "aiConsumer.tryPrompt":
          'Prueba: "¿Cómo hago un porro más firme sin que se canalee?"',
        "aiConsumer.recent": "Conversaciones recientes",
        "aiConsumer.viewAll": "Ver todos los chats",

        // Consumer Chat pages
        "consumerChat.list.title": "Chats de consumidor recientes",
        "consumerChat.list.empty": "Aún no hay chats.",
        "consumerChat.detail.title": "Chat de consumidor",
        "consumerChat.detail.empty": "Aún no hay mensajes.",

        // Common
        "common.clear": "Limpiar",
        "common.tapToView": "Ver",
        "common.view": "Ver",
        "app.name": "cannafriend",
        "app.description": "Inicia sesión para continuar",
        "landing.hero":
          "Tu compañero perfecto para el cultivo de plantas. Registra, monitorea y optimiza el crecimiento de tus plantas de manera profesional.",

        // Features (landing)
        "features.management.title": "Gestión de Plantas",
        "features.management.desc":
          "Registra y gestiona múltiples plantas con información detallada de cada una, con búsqueda rápida",
        "features.journal.title": "Diario de Cultivo",
        "features.journal.desc":
          "Lleva un registro completo de actividades (riego, fertilización, entrenamiento) y agrega recordatorios",
        "features.gallery.title": "Galería de Fotos",
        "features.gallery.desc":
          "Documenta el crecimiento de tus plantas con fotos organizadas por fecha",
        "features.monitoring.title": "Monitoreo Ambiental",
        "features.monitoring.desc":
          "Registra temperatura, humedad, pH y otros parámetros ambientales",
        "features.reminders.title": "Recordatorios",
        "features.reminders.desc":
          "Configura avisos para no olvidar riegos, tareas o sesiones",
        "features.roles.title": "Dos modos: Cultivador y Fumador",
        "features.roles.desc":
          "Elige cómo usar la app: registra y gestiona cultivos o lleva un registro de tus sesiones y variedades",
        "features.search.title": "Búsqueda Avanzada",
        "features.search.desc":
          "Encuentra rápidamente plantas, registros y actividades específicas",
        "features.section.grower": "Modo Cultivador",
        "features.section.consumer": "Modo Fumador",
        "features.consumer.sessions.title": "Sesiones",
        "features.consumer.sessions.desc":
          "Carga sesiones con variedad, método (pipe, vaper, joint, etc.), cantidad, fecha/horario y notas",
        "features.consumer.history.title": "Historial",
        "features.consumer.history.desc":
          "Consulta y organiza tus sesiones registradas",
        "features.consumer.notes.title": "Notas y experiencias",
        "features.consumer.notes.desc":
          "Anota efectos, sabor y estado de ánimo",
        "features.consumer.photos.title": "Fotos",
        "features.consumer.photos.desc":
          "Adjunta imágenes a tus sesiones para documentar",

        // Login/Signup
        "login.title": "Iniciar Sesión",
        "login.email": "Correo Electrónico",
        "login.password": "Contraseña",
        "login.submit": "Iniciar Sesión",
        "login.loading": "Iniciando sesión...",
        "login.error": "Error al iniciar sesión",
        "login.or": "o continuar con",
        "login.google": "Continuar con Google",
        "login.terms":
          "Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad",
        "terms.title": "Términos de Servicio",
        "terms.lastUpdated": "Última actualización",
        "terms.acceptance": "Aceptación de los Términos",
        "terms.acceptanceDesc":
          "Al acceder y usar cannafriend, aceptas estar sujeto a estos términos de servicio.",
        "terms.use": "Uso del Servicio",
        "terms.useDesc":
          "cannafriend es una aplicación para el seguimiento del crecimiento de plantas. Debes usar el servicio de manera responsable y legal.",
        "terms.account": "Cuenta de Usuario",
        "terms.accountDesc":
          "Eres responsable de mantener la confidencialidad de tu cuenta y contraseña.",
        "terms.privacy": "Privacidad",
        "terms.privacyDesc":
          "Tu privacidad es importante. Consulta nuestra Política de Privacidad para más detalles.",
        "terms.termination": "Terminación",
        "terms.terminationDesc":
          "Podemos terminar o suspender tu cuenta en cualquier momento por violación de estos términos.",
        "terms.changes": "Cambios en los Términos",
        "terms.changesDesc":
          "Nos reservamos el derecho de modificar estos términos en cualquier momento.",
        "terms.contact": "Contacto",
        "terms.contactDesc":
          "Si tienes preguntas sobre estos términos, contáctanos en nachthelad.dev@gmail.com",

        // Privacy Policy
        "privacy.title": "Política de Privacidad",
        "privacy.lastUpdated": "Última actualización",
        "privacy.intro": "Introducción",
        "privacy.introDesc":
          "Esta Política de Privacidad describe cómo cannafriend recopila, usa y protege tu información personal.",
        "privacy.collection": "Información que Recopilamos",
        "privacy.collectionDesc":
          "Recopilamos información que nos proporcionas directamente, como tu correo electrónico y datos de tu cuenta.",
        "privacy.usage": "Cómo Usamos tu Información",
        "privacy.usageDesc":
          "Usamos tu información para proporcionar y mejorar nuestros servicios, comunicarnos contigo y personalizar tu experiencia.",
        "privacy.sharing": "Compartir Información",
        "privacy.sharingDesc":
          "No vendemos, alquilamos ni compartimos tu información personal con terceros sin tu consentimiento.",
        "privacy.security": "Seguridad",
        "privacy.securityDesc":
          "Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal.",
        "privacy.cookies": "Cookies",
        "privacy.cookiesDesc":
          "Utilizamos cookies para mejorar tu experiencia en nuestra aplicación.",
        "privacy.rights": "Tus Derechos",
        "privacy.rightsDesc":
          "Tienes derecho a acceder, corregir o eliminar tu información personal en cualquier momento.",
        "privacy.changes": "Cambios en la Política",
        "privacy.changesDesc":
          "Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos de cualquier cambio importante.",
        "privacy.contact": "Contacto",
        "privacy.contactDesc":
          "Si tienes preguntas sobre esta política de privacidad, contáctanos en nachthelad.dev@gmail.com",
        "login.forgotPassword": "¿Olvidaste tu contraseña?",
        "login.enterEmailFirst":
          "Por favor ingresa tu correo electrónico primero",
        "login.passwordResetSent": "Correo de recuperación enviado",
        "login.checkEmailForReset":
          "Revisa tu correo electrónico para restablecer tu contraseña",
        "login.verifyingCredentials": "Verificando credenciales...",
        "login.signingIn": "Iniciando sesión...",
        "login.verifyingConfig": "Verificando configuración...",
        "login.emailNotRegistered":
          "El correo electrónico no está registrado. Por favor, regístrate o verifica tu email.",

        // Password Reset
        "forgotPassword.title": "Recuperar contraseña",
        "forgotPassword.description":
          "Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.",
        "forgotPassword.email": "Correo electrónico",
        "forgotPassword.submit": "Enviar email de recuperación",
        "forgotPassword.loading": "Enviando...",
        "forgotPassword.success": "Email enviado",
        "forgotPassword.successMessage":
          "Se ha enviado un email de recuperación a tu correo electrónico. Revisa tu bandeja de entrada.",
        "forgotPassword.error": "Error al enviar el email",
        "forgotPassword.emailNotRegistered":
          "El correo electrónico no está registrado. Por favor, intenta con otro correo o regístrate.",
        "forgotPassword.backToLogin": "Volver al login",
        "forgotPassword.emailSent": "Email enviado",
        "forgotPassword.emailSentMessage":
          "Hemos enviado un email de recuperación a tu correo electrónico.",
        "forgotPassword.checkEmail":
          "Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.",
        "forgotPassword.verifyingEmail": "Verificando email...",
        "forgotPassword.sendingEmail": "Enviando email de recuperación...",
        "forgotPassword.emailSentTitle": "Email enviado",
        "forgotPassword.emailSentDescription":
          "Se ha enviado un email de recuperación. Revisa tu bandeja de entrada (y spam). Redirigiendo al login...",
        "forgotPassword.emailNotRegisteredTitle": "Email no registrado",
        "forgotPassword.emailNotRegisteredDescription":
          "No se encontró una cuenta con este correo electrónico. Por favor, verifica el email o regístrate.",

        "resetPassword.title": "Restablecer contraseña",
        "resetPassword.description":
          "Ingresa tu nueva contraseña para completar el proceso de recuperación.",
        "resetPassword.password": "Nueva contraseña",
        "resetPassword.confirmPassword": "Confirmar contraseña",
        "resetPassword.submit": "Actualizar contraseña",
        "resetPassword.loading": "Actualizando...",
        "resetPassword.success": "¡Contraseña actualizada!",
        "resetPassword.successMessage":
          "Tu contraseña ha sido restablecida exitosamente.",
        "resetPassword.error": "Error al restablecer la contraseña",
        "resetPassword.passwordsDoNotMatch": "Las contraseñas no coinciden.",
        "resetPassword.weakPassword":
          "La contraseña es demasiado débil. Usa al menos 6 caracteres.",
        "resetPassword.expiredLink":
          "El enlace ha expirado. Solicita un nuevo enlace.",
        "resetPassword.invalidLink":
          "Enlace inválido. Solicita un nuevo enlace.",
        "resetPassword.verifying": "Verificando enlace...",
        "resetPassword.invalidLinkError":
          "Enlace inválido. Solicita un nuevo enlace de recuperación.",
        "resetPassword.expiredLinkError":
          "El enlace de recuperación ha expirado o es inválido. Solicita un nuevo enlace.",
        "resetPassword.updatingPassword": "Actualizando contraseña...",
        "resetPassword.successDescription":
          "Tu contraseña ha sido actualizada exitosamente. Serás redirigido al login.",
        "resetPassword.redirectingMessage":
          "Serás redirigido al login en 3 segundos...",

        "signup.title": "Registrarse",
        "signup.email": "Correo Electrónico",
        "signup.password": "Contraseña",
        "signup.confirmPassword": "Confirmar Contraseña",
        "signup.submit": "Registrarse",
        "signup.loading": "Registrando...",
        "signup.error": "Error al registrarse",
        "signup.passwordTooShort":
          "La contraseña debe tener al menos 6 caracteres",
        "signup.passwordsDoNotMatch": "Las contraseñas no coinciden",
        "signup.passwordRequirements":
          "La contraseña debe tener al menos 6 caracteres",
        "signup.recaptchaRequired": "Por favor completa el reCAPTCHA",
        "signup.recaptchaExpired":
          "El reCAPTCHA ha expirado, por favor complétalo nuevamente",
        "signup.recaptchaError":
          "Error en el reCAPTCHA, por favor inténtalo nuevamente",
        "signup.validatingData": "Validando datos...",
        "signup.creatingAccount": "Creando cuenta...",
        "signup.savingData": "Guardando datos...",

        // Onboarding
        "onboarding.title": "Bienvenido",
        "onboarding.description": "Configura tu cuenta para comenzar",
        "onboarding.timezone": "Zona Horaria",
        "onboarding.selectTimezone": "Selecciona tu zona horaria",
        "onboarding.roles": "¿Cómo usarás la app?",
        "onboarding.grower": "Cultivador",
        "onboarding.consumer": "Fumador",
        "onboarding.selectAtLeastOneRole": "Selecciona al menos una opción",
        "onboarding.submit": "Continuar",
        "onboarding.loading": "Guardando...",
        "onboarding.success": "¡Configuración guardada!",
        "onboarding.successMessage":
          "Tu cuenta ha sido configurada correctamente",
        "onboarding.error": "Error al guardar la configuración",
        "onboarding.info":
          "Esta información nos ayuda a mostrar fechas y recordatorios en tu zona horaria",

        // Dashboard
        "dashboard.title": "Panel de Cultivo",
        "dashboard.addPlant": "Agregar Planta",
        "dashboard.noPlants": "No tienes plantas",
        "dashboard.noPlantDesc":
          "Agrega tu primera planta para comenzar a hacer seguimiento",
        "dashboard.error": "Error al cargar las plantas",
        "dashboard.reminders": "Recordatorios",
        "dashboard.yourPlants": "Tus Plantas",

        // New Plant
        "newPlant.title": "Agregar Nueva Planta",
        "newPlant.description": "Ingresa los detalles de tu planta",
        "newPlant.name": "Nombre",
        "newPlant.namePlaceholder": "Ej: Ultra Wonka, OG Kush, etc.",
        "newPlant.seedType": "Tipo de Semilla",
        "newPlant.autoflowering": "Autofloreciente",
        "newPlant.photoperiodic": "Fotoperiódica",
        "newPlant.growType": "Tipo de Cultivo",
        "newPlant.indoor": "Interior",
        "newPlant.outdoor": "Exterior",
        "newPlant.plantingDate": "Fecha de Plantación",
        "newPlant.pickDate": "Selecciona una fecha",
        "newPlant.lightSchedule": "Ciclo de Luz",
        "newPlant.selectLightSchedule": "Selecciona un ciclo de luz",
        "newPlant.lightSchedulePlaceholder": "Ej: 20/4, 18/6, 24/0, 12/12",
        "newPlant.vegetative": "Vegetativo",
        "newPlant.flowering": "Floración",
        "newPlant.submit": "Guardar Planta",
        "newPlant.loading": "Guardando...",
        "newPlant.success": "¡Planta agregada!",
        "newPlant.successMessage": "Tu planta ha sido agregada correctamente",
        "newPlant.error": "Error al agregar la planta",
        "newPlant.seedBank": "Banco de Semillas",
        "newPlant.seedBankPlaceholder":
          "Ej: Dutch Passion, Barney's Farm, etc.",
        "newPlant.photos": "Fotos",

        // Plant Page
        "plantPage.details": "Detalles",
        "plantPage.journal": "Diario",
        "plantPage.environment": "Ambiente",
        "plantPage.photos": "Fotos",
        "plantPage.notFound": "Planta no encontrada",
        "plantPage.notFoundDesc":
          "La planta que buscas no existe o ha sido eliminada",
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
        "plantPage.age": "Edad",
        "plantPage.days": "días",
        "plantPage.lastWatering": "Último riego",
        "plantPage.noWateringRecords": "No hay registros de riego",
        "plantPage.lastFeeding": "Última alimentación",
        "plantPage.noFeedingRecords": "No hay registros de alimentación",
        "plantPage.lastTraining": "Último entrenamiento",
        "plantPage.noTrainingRecords": "No hay registros de entrenamiento",
        "plantPage.floweringAge": "Edad de floración",
        "plantPage.noPhotos": "No hay fotos",
        "plantPage.noPhotosDesc": "Agrega fotos a tu planta",

        // Settings
        "settings.title": "Configuración",
        "settings.preferences": "Preferencias",
        "settings.preferencesDesc": "Personaliza tu experiencia",
        "settings.roles": "Roles",
        "settings.updated": "Configuración actualizada",
        "settings.account": "Cuenta",
        "settings.accountDesc": "Resumen de tu cuenta",
        "settings.language": "Idioma",
        "settings.timezone": "Zona Horaria",
        "settings.selectTimezone": "Selecciona tu zona horaria",
        "settings.darkMode": "Modo Oscuro",
        "settings.timezoneUpdated": "Zona horaria actualizada",
        "settings.timezoneUpdatedDesc":
          "Tu zona horaria ha sido actualizada correctamente",
        "settings.darkModeUpdated": "Modo oscuro actualizado",
        "settings.darkModeOn": "Modo oscuro activado",
        "settings.darkModeOff": "Modo oscuro desactivado",
        "settings.error": "Error al guardar la configuración",
        "settings.dangerZone": "Zona de Peligro",
        "settings.dangerZoneDesc": "Acciones irreversibles",
        "settings.deleteAccount": "Eliminar Cuenta",
        "settings.confirmDelete": "¿Estás seguro?",
        "settings.confirmDeleteDesc": "Esta acción no se puede deshacer.",
        // Plant Delete
        "plant.deleteTitle": "Eliminar planta",
        "plant.deleteDesc":
          "Esta acción no se puede deshacer. Se eliminarán la planta y sus registros.",
        "plant.deleteConfirm": "Eliminar planta",
        "settings.cancel": "Cancelar",
        "settings.confirmDeleteButton": "Sí, eliminar mi cuenta",
        "settings.deleting": "Eliminando...",
        "settings.accountDeleted": "Cuenta eliminada",
        "settings.accountDeletedDesc":
          "Tu cuenta ha sido eliminada correctamente",
        "settings.deleteError": "Error al eliminar la cuenta",
        "settings.enableNotifications": "Activar notificaciones",
        "settings.reauthRequired":
          "Por seguridad, vuelve a iniciar sesión y reintenta.",

        // Navigation
        "nav.dashboard": "Panel de Control",
        "nav.addPlant": "Agregar Planta",
        "nav.journal": "Diario",
        "nav.settings": "Configuración",
        "nav.signOut": "Cerrar Sesión",
        "nav.menu": "Menú de Navegación",
        "nav.goToApp": "Ir a la app",

        // Journal
        "journal.title": "Diario de Cultivo",
        "journal.description":
          "Registra y visualiza todas las actividades de tus plantas",
        "journal.loading": "Cargando registros...",
        "journal.noEntries": "No hay registros",
        "journal.noEntriesDesc":
          "Agrega un registro para comenzar a hacer seguimiento",
        "journal.error": "Error al cargar los registros",
        "journal.listView": "Vista de Lista",
        "journal.calendarView": "Vista de Calendario",
        "journal.filters": "Filtros",
        "journal.filtersDesc": "Filtra los registros por planta, tipo y fecha",
        "journal.filterByPlant": "Filtrar por Planta",
        "journal.selectPlant": "Selecciona una planta",
        "journal.allPlants": "Todas las plantas",
        "journal.filterByType": "Filtrar por Tipo",
        "journal.selectType": "Selecciona un tipo",
        "journal.allTypes": "Todos los tipos",
        "journal.filterByDate": "Filtrar por Fecha",
        "journal.clearDate": "Limpiar fecha",
        "journal.addLog": "Agregar Registro",
        "journal.addLogDesc": "Registra una nueva actividad",
        "journal.recentLogs": "Registros Recientes",
        "journal.logsFound": "registros encontrados",
        "journal.calendarDesc": "Visualiza tus registros en un calendario",
        "journal.logsFor": "Registros para",

        // Log Types
        "logType.watering": "Riego",
        "logType.feeding": "Fertilización",
        "logType.training": "Entrenamiento",
        "logType.environment": "Ambiente",
        "logType.flowering": "Paso a floración",
        "logType.note": "Nota",

        // Log Form
        "logForm.type": "Tipo de Registro",
        "logForm.date": "Fecha",
        "logForm.notes": "Notas",
        "logForm.submit": "Guardar Registro",
        "logForm.loading": "Guardando...",
        "logForm.success": "¡Registro guardado!",
        "logForm.successDesc": "El registro ha sido guardado correctamente",
        "logForm.error": "Error al guardar el registro",
        "logForm.selectType": "Selecciona un tipo",
        "logForm.selectDate": "Selecciona una fecha",

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
        "environment.noData": "No hay datos",
        "environment.noDataDesc": "No hay datos disponibles",

        // Common
        "common.error": "Error",
        "common.unknownError": "Error desconocido",
        "common.fieldRequired": "Este campo es requerido",
        "common.success": "Éxito",
        "common.loading": "Cargando...",
        "common.save": "Guardar",
        "common.cancel": "Cancelar",
        "common.delete": "Eliminar",
        "common.edit": "Editar",
        "common.add": "Agregar",
        "common.confirm": "Confirmar",
        "common.back": "Volver",

        // Auth Errors
        "auth.error": "Error de autenticación",
        "auth.userNotFound": "Usuario no encontrado",
        "auth.wrongPassword": "Contraseña incorrecta",
        "auth.emailAlreadyInUse": "El correo electrónico ya está en uso",
        "auth.weakPassword": "La contraseña es demasiado débil",
        "auth.invalidEmail": "Correo electrónico inválido",
        "auth.incompleteEmail": "Por favor completa el correo electrónico",
        "auth.tooManyRequests": "Demasiados intentos. Intenta más tarde",
        "auth.networkError": "Error de conexión. Verifica tu internet",
        "auth.passwordTooShort": "La contraseña es muy corta",

        // Firebase Errors
        "firebase.permissionDenied":
          "No tienes permisos para realizar esta acción",
        "firebase.unavailable": "Servicio no disponible. Intenta más tarde",
        "firebase.notFound": "Recurso no encontrado",

        // Validation
        "validation.error": "Error de validación",
        "validation.unknownError": "Error de validación desconocido",
        "validation.required": "Este campo es requerido",
        "validation.invalidLightSchedule":
          "Formato inválido. Usa HH/HH, por ejemplo 20/4, 18/6, 24/0, 12/12",
        "validation.email": "Correo electrónico inválido",
        "validation.password": "La contraseña debe tener al menos 6 caracteres",
        "validation.minLength": "Debe tener al menos {min} caracteres",
        "validation.maxLength": "Debe tener máximo {max} caracteres",
        "validation.minValue": "Debe ser mayor o igual a {min}",
        "validation.maxValue": "Debe ser menor o igual a {max}",
        "validation.invalidDate": "Fecha inválida",

        // Reminders
        "reminders.title": "Recordatorios",
        "reminders.description": "Gestiona recordatorios para tus plantas",
        "reminders.loading": "Cargando recordatorios...",
        "reminders.add": "Agregar Recordatorio",
        "reminders.addReminder": "Agregar Recordatorio",
        "reminders.selectPlant": "Selecciona una planta",
        "reminders.reminderType": "Tipo de Recordatorio",
        "reminders.reminderTitle": "Título",
        "reminders.reminderDescription": "Descripción",
        "reminders.frequency": "Frecuencia",
        "reminders.interval": "Intervalo (días)",
        "reminders.daily": "Diario",
        "reminders.weekly": "Semanal",
        "reminders.custom": "Personalizado",
        "reminders.days": "días",
        "reminders.success": "¡Recordatorio agregado!",
        "reminders.successMessage":
          "Tu recordatorio ha sido creado correctamente",
        "reminders.updated": "Recordatorio actualizado",
        "reminders.activated": "Recordatorio activado",
        "reminders.deactivated": "Recordatorio desactivado",
        "reminders.deleted": "Recordatorio eliminado",
        "reminders.deletedMessage": "Tu recordatorio ha sido eliminado",
        "reminders.noReminders": "No hay recordatorios",
        "reminders.noRemindersDesc":
          "Agrega recordatorios para mantener un seguimiento de tus plantas",
        "reminders.overdue": "Vencidos",
        "reminders.overdueDesc": "Estos recordatorios están vencidos",
        "reminders.dueSoon": "Próximos",
        "reminders.dueSoonDesc": "Vencen en las próximas 24 horas",
        "reminders.markDone": "OK",
        "reminders.wateringTitle": "Regar planta",
        "reminders.wateringDesc": "Es hora de regar tu planta",
        "reminders.feedingTitle": "Fertilizar planta",
        "reminders.feedingDesc": "Es hora de fertilizar tu planta",
        "reminders.trainingTitle": "Entrenar planta",
        "reminders.trainingDesc": "Es hora de entrenar tu planta",
        "reminders.customTitle": "Recordatorio personalizado",
        "reminders.customDesc": "Recordatorio personalizado",
        "reminders.noPlants": "No hay plantas",
        "reminders.noPlantsDesc": "Agrega una planta para crear recordatorios",
        "reminders.noPlantsHint": "Agrega una planta para crear recordatorios",
        "reminders.pageDescription": "Gestiona recordatorios para tus plantas",

        // Strains (Consumer)
        "strains.title": "Variedades",
        "strains.description":
          "Lleva un registro de tus variedades y sesiones.",
        "strains.addSession": "Nueva sesión",
        "strains.required": "La variedad es obligatoria",
        "strains.saved": "Sesión guardada",
        "strains.noSessions": "Sin sesiones",
        "strains.noSessionsDesc": "Crea tu primera sesión para empezar.",
        "strains.strain": "Variedad",
        "strains.strainPlaceholder": "Ej: OG Kush",
        "strains.method": "Método",
        "strains.methodPlaceholder": "Pipe, Vaper, Joint, Bongo...",
        "strains.amount": "Cantidad",
        "strains.amountPlaceholder": "Ej: 0.3g",
        "strains.notes": "Notas",
        "strains.notesPlaceholder": "Efectos, sabor, estado de ánimo...",
        "strains.save": "Guardar",
        "strains.edit": "Editar",
        "strains.update": "Actualizar",
        "strains.updated": "Sesión actualizada",
        "strains.delete": "Eliminar",
        "strains.deleted": "Sesión eliminada",
        "strains.editSession": "Editar sesión",
        "strains.deleteConfirmTitle": "Eliminar sesión",
        "strains.deleteConfirmDesc":
          "Esta acción no se puede deshacer. Perderás la información cargada.",
        "strains.deleteConfirm": "Sí, eliminar",
        "strains.startTime": "Hora de inicio",
        "strains.endTime": "Hora de fin",
        "strains.photos": "Fotos",

        // Favorites (Consumer)
        "favorites.filter": "Favoritas",
        "favorites.added": "Agregada a favoritas",
        "favorites.removed": "Quitada de favoritas",
        "favorites.only": "Solo favoritas",

        // Stash/Inventory (Consumer)
        "stash.title": "Inventario",
        "stash.description": "Gestiona tus flores, extractos y comestibles",
        "stash.addItem": "Agregar ítem",
        "stash.name": "Nombre",
        "stash.type": "Tipo",
        "stash.types.flower": "Flor",
        "stash.types.concentrate": "Extracto",
        "stash.types.edible": "Comestible",
        "stash.amount": "Cantidad",
        "stash.unit": "Unidad",
        "stash.units.g": "g",
        "stash.units.ml": "ml",
        "stash.units.units": "unidades",
        "stash.thc": "% THC",
        "stash.cbd": "% CBD",
        "stash.addedAt": "Fecha de compra",
        "stash.vendor": "Proveedor",
        "stash.price": "Precio",
        "stash.notes": "Notas",
        "stash.save": "Guardar",
        "stash.update": "Actualizar",
        "stash.delete": "Eliminado",
        "stash.empty": "Sin inventario",
        "stash.emptyDesc": "Agrega tu primer ítem para empezar",
        "stash.saved": "Inventario guardado",
        "stash.savedDesc": "El ítem fue guardado correctamente",
        "stash.updated": "Inventario actualizado",
        "stash.updatedDesc": "El ítem fue actualizado correctamente",
        "stash.nameRequired": "El nombre es obligatorio",
        "stash.amountRequired": "La cantidad es obligatoria",
        "stash.requiredHint":
          "Nombre y cantidad son obligatorios. El resto es opcional.",

        // Add chooser (mobile +)
        "addChooser.title": "¿Qué deseas agregar?",
        "addChooser.plant": "Nueva planta",
        "addChooser.session": "Nueva sesión",

        // Home chooser (mobile home when both roles)
        "homeChooser.title": "¿A dónde quieres ir?",
        "homeChooser.dashboard": "Panel de cultivo",
        "homeChooser.sessions": "Sesiones",

        // Notifications
        "notifications.enable": "Activar notificaciones",
        "notifications.enabled": "Notificaciones activadas",
        "notifications.permissionDenied": "Permiso denegado",
        "notifications.missingVapid": "Falta la clave pública VAPID",
        "notifications.unsupported":
          "Notificaciones no soportadas en este navegador",
        "notifications.tokenFailed":
          "No se pudo obtener el token de notificación",
        "notifications.unknown": "No se pudo activar",
        "notifications.tokenCopied": "Token copiado al portapapeles",

        // Search
        "search.placeholder": "Buscar plantas, registros...",
        "search.noResults": "No se encontraron resultados",
        "search.searching": "Buscando...",

        // Plant Card
        "plantCard.lastWatering": "Último riego",
        "plantCard.noWateringRecords": "No hay registros de riego",
        "plantCard.lastFeeding": "Última alimentación",
        "plantCard.noFeedingRecords": "No hay registros de alimentación",
        "plantCard.lastTraining": "Último entrenamiento",
        "plantCard.noTrainingRecords": "No hay registros de entrenamiento",

        // Photos
        "photos.title": "Fotos",
        "photos.photo": "foto",
        "photos.photos": "fotos",
        "photos.addPhotos": "Agregar Fotos",
        "photos.uploadPhotos": "Subir Fotos",
        "photos.noPhotos": "No hay fotos",
        "photos.noPhotosDesc":
          "Agrega fotos para documentar el crecimiento de tu planta",
        "photos.addFirstPhoto": "Agregar Primera Foto",
        "photos.plantPhoto": "Foto de planta",
        "photos.uploadSuccess": "¡Fotos subidas!",
        "photos.photosUpdated": "Las fotos han sido actualizadas correctamente",
        "photos.uploadError": "Error al subir fotos",
        "photos.removeSuccess": "Foto eliminada",
        "photos.photoRemoved": "La foto ha sido eliminada correctamente",
        "photos.removeError": "Error al eliminar la foto",

        // Cover Photo
        "photos.setAsCover": "Establecer como portada",
        "photos.coverPhotoSet": "¡Foto de portada establecida!",
        "photos.coverPhotoSetDesc":
          "La foto se mostrará en la tarjeta de la planta",
        "photos.coverPhotoError": "Error al establecer foto de portada",
        "photos.coverSet": "¡Portada actualizada!",
        "plantCard.coverPhoto": "Foto de portada",
        "photos.setCoverConfirmTitle": "Establecer como portada",
        "photos.setCoverConfirmDesc":
          "¿Querés establecer esta foto como portada de la planta?",

        // Image Upload
        "imageUpload.dragDrop": "Arrastra y suelta imágenes aquí",
        "imageUpload.orClick": "o haz clic para seleccionar",
        "imageUpload.selectImages": "Seleccionar Imágenes",
        "imageUpload.uploading": "Subiendo...",
        "imageUpload.allowedTypes": "Tipos permitidos:",
        "imageUpload.maxSize": "Tamaño máximo:",
        "imageUpload.maxImages": "Máximo de imágenes:",
        "imageUpload.preview": "Vista previa",
        "imageUpload.image": "imagen",
        "imageUpload.invalidType":
          "Tipo de archivo no válido. Tipos permitidos:",
        "imageUpload.tooLarge": "Archivo demasiado grande. Máximo:",
        "imageUpload.tooManyImages": "Demasiadas imágenes",
        "imageUpload.maxImagesReached":
          "Has alcanzado el límite máximo de imágenes",
        "imageUpload.validationErrors": "Errores de validación",
        "imageUpload.uploadError": "Error al subir",
        "imageUpload.uploadFailed": "Error al subir la imagen",
        "imageUpload.uploadSuccess": "¡Imágenes subidas!",
        "imageUpload.imagesUploaded": "imágenes subidas correctamente",

        // Gallery
        "gallery.image": "Imagen",
        "gallery.thumbnail": "Miniatura",

        // Image Errors
        "imageErrors.userNotAuthenticated": "Usuario no autenticado",
        "imageErrors.fileTooLarge": "El archivo es demasiado grande",
        "imageErrors.invalidFileType": "Tipo de archivo no válido",
        "imageErrors.uploadFailed": "Error al subir el archivo",
      };

      const enTranslations = {
        // Analyze Plant
        "analyzePlant.title": "AI Analysis",
        "analyzePlant.defaultPrompt":
          "Analyze this marijuana plant for nutrient deficiencies, potential infections, and suggestions for care or feeding.",
        "analyzePlant.uploadImage": "Plant photo",
        "analyzePlant.takePhoto": "Take Photo",
        "analyzePlant.uploadFromGallery": "Upload",
        "analyzePlant.askQuestion": "Question (optional)",
        "analyzePlant.questionPlaceholder": "E.g., What is this plant missing?",
        "analyzePlant.analyzeWithAI": "Analyze with AI",
        "analyzePlant.analysisResult": "AI Result",
        "analyzePlant.journal": "AI Analysis Journal",
        "analyzePlant.noAnalyses":
          "No analyses yet. Your results will appear here.",
        "analyzePlant.defaultQuestion": "General analysis",
        "analyzePlant.viewHistory": "View history",
        "analyzePlant.hideHistory": "Hide history",
        // Analysis details page
        "analysis.notFound": "Analysis not found",

        // Premium
        "premium.title": "Premium feature",
        "premium.analyzeDesc":
          "Unlock AI-powered plant analysis to diagnose issues and optimize care.",
        "premium.upgrade": "Upgrade to Premium",
        // Premium page
        "premium.wip": "We're working on the Premium plan.",
        "premium.mercadoPago": "You'll be able to pay with Mercado Pago soon.",
        "premium.back": "Back to dashboard",

        // AI Consumer Chat
        "aiConsumer.title": "AI Chat",
        "aiConsumer.intro":
          "Ask about rolling technique, improving joints, dosage, session planning, flavors/terpenes, storage, etiquette, and harm reduction.",
        "aiConsumer.placeholder":
          "Ask about rolling, dosage, routines, flavors...",
        "aiConsumer.send": "Send",
        "aiConsumer.tryPrompt":
          'Try: "How do I make a tighter joint without canoeing?"',
        "aiConsumer.recent": "Recent conversations",
        "aiConsumer.viewAll": "View all chats",

        // Consumer Chat pages
        "consumerChat.list.title": "Recent consumer chats",
        "consumerChat.list.empty": "No chats yet.",
        "consumerChat.detail.title": "Consumer Chat",
        "consumerChat.detail.empty": "No messages yet.",

        // Common
        "common.clear": "Clear",
        "common.tapToView": "Tap to view",
        "common.view": "View",
        "app.name": "cannafriend",
        "app.description": "Sign in to continue",
        "landing.hero":
          "Your perfect companion for plant growing. Record, monitor, and optimize your plants' growth like a pro.",

        // Features (landing)
        "features.management.title": "Plant Management",
        "features.management.desc":
          "Register and manage multiple plants with detailed info and quick search",
        "features.journal.title": "Grow Journal",
        "features.journal.desc":
          "Keep a complete log (watering, feeding, training) and add reminders",
        "features.gallery.title": "Photo Gallery",
        "features.gallery.desc":
          "Document your plants' growth with photos organized by date",
        "features.monitoring.title": "Environmental Monitoring",
        "features.monitoring.desc":
          "Track temperature, humidity, pH and other environmental parameters",
        "features.reminders.title": "Reminders",
        "features.reminders.desc":
          "Set reminders so you don't forget watering, tasks or sessions",
        "features.roles.title": "Two modes: Grower and Consumer",
        "features.roles.desc":
          "Choose how you use the app: manage your grows or track your sessions and strains",
        "features.search.title": "Advanced Search",
        "features.search.desc":
          "Quickly find plants, logs and specific activities",
        "features.section.grower": "Grower mode",
        "features.section.consumer": "Consumer mode",
        "features.consumer.sessions.title": "Sessions",
        "features.consumer.sessions.desc":
          "Log sessions with strain, method (pipe, vape, joint, etc.), amount, date/time and notes",
        "features.consumer.history.title": "History",
        "features.consumer.history.desc":
          "Browse and organize your recorded sessions",
        "features.consumer.notes.title": "Notes and experiences",
        "features.consumer.notes.desc": "Write effects, flavor and mood",
        "features.consumer.photos.title": "Photos",
        "features.consumer.photos.desc":
          "Attach images to your sessions to document",

        // Login/Signup
        "login.title": "Login",
        "login.email": "Email",
        "login.password": "Password",
        "login.submit": "Sign In",
        "login.loading": "Signing in...",
        "login.error": "Login error",
        "login.or": "or continue with",
        "login.google": "Continue with Google",
        "login.terms":
          "By continuing, you agree to our Terms of Service and Privacy Policy",
        "terms.title": "Terms of Service",
        "terms.lastUpdated": "Last updated",
        "terms.acceptance": "Acceptance of Terms",
        "terms.acceptanceDesc":
          "By accessing and using cannafriend, you agree to be bound by these terms of service.",
        "terms.use": "Use of Service",
        "terms.useDesc":
          "cannafriend is an application for tracking plant growth. You must use the service responsibly and legally.",
        "terms.account": "User Account",
        "terms.accountDesc":
          "You are responsible for maintaining the confidentiality of your account and password.",
        "terms.privacy": "Privacy",
        "terms.privacyDesc":
          "Your privacy is important. Please refer to our Privacy Policy for more details.",
        "terms.termination": "Termination",
        "terms.terminationDesc":
          "We may terminate or suspend your account at any time for violation of these terms.",
        "terms.changes": "Changes to Terms",
        "terms.changesDesc":
          "We reserve the right to modify these terms at any time.",
        "terms.contact": "Contact",
        "terms.contactDesc":
          "If you have questions about these terms, please contact us at nachthelad.dev@gmail.com",

        // Privacy Policy
        "privacy.title": "Privacy Policy",
        "privacy.lastUpdated": "Last updated",
        "privacy.intro": "Introduction",
        "privacy.introDesc":
          "This Privacy Policy describes how cannafriend collects, uses, and protects your personal information.",
        "privacy.collection": "Information We Collect",
        "privacy.collectionDesc":
          "We collect information you provide directly to us, such as your email address and account data.",
        "privacy.usage": "How We Use Your Information",
        "privacy.usageDesc":
          "We use your information to provide and improve our services, communicate with you, and personalize your experience.",
        "privacy.sharing": "Sharing Information",
        "privacy.sharingDesc":
          "We do not sell, rent, or share your personal information with third parties without your consent.",
        "privacy.security": "Security",
        "privacy.securityDesc":
          "We implement technical and organizational security measures to protect your personal information.",
        "privacy.cookies": "Cookies",
        "privacy.cookiesDesc":
          "We use cookies to enhance your experience in our application.",
        "privacy.rights": "Your Rights",
        "privacy.rightsDesc":
          "You have the right to access, correct, or delete your personal information at any time.",
        "privacy.changes": "Changes to Policy",
        "privacy.changesDesc":
          "We may update this privacy policy occasionally. We will notify you of any significant changes.",
        "privacy.contact": "Contact",
        "privacy.contactDesc":
          "If you have questions about this privacy policy, please contact us at nachthelad.dev@gmail.com",

        "signup.title": "Sign Up",
        "signup.email": "Email",
        "signup.password": "Password",
        "signup.confirmPassword": "Confirm Password",
        "signup.submit": "Sign Up",
        "signup.loading": "Signing up...",
        "signup.error": "Sign up error",
        "signup.passwordTooShort": "Password must be at least 6 characters",
        "signup.passwordsDoNotMatch": "Passwords do not match",
        "signup.passwordRequirements": "Password must be at least 6 characters",
        "signup.recaptchaRequired": "Please complete the reCAPTCHA",
        "signup.recaptchaExpired":
          "The reCAPTCHA has expired, please complete it again",
        "signup.recaptchaError": "reCAPTCHA error, please try again",
        "signup.validatingData": "Validating data...",
        "signup.creatingAccount": "Creating account...",
        "signup.savingData": "Saving data...",

        // Forgot Password
        "forgotPassword.title": "Recover Password",
        "forgotPassword.description":
          "Enter your email and we'll send you a link to reset your password.",
        "forgotPassword.email": "Email",
        "forgotPassword.submit": "Send recovery email",
        "forgotPassword.loading": "Sending...",
        "forgotPassword.success": "Email sent",
        "forgotPassword.successMessage":
          "A recovery email has been sent to your email address. Check your inbox.",
        "forgotPassword.error": "Error sending email",
        "forgotPassword.emailNotRegistered":
          "The email address is not registered. Please try another email or sign up.",
        "forgotPassword.backToLogin": "Back to login",
        "forgotPassword.emailSent": "Email sent",
        "forgotPassword.emailSentMessage":
          "We have sent a recovery email to your email address.",
        "forgotPassword.checkEmail":
          "Check your inbox and follow the instructions to reset your password.",
        "forgotPassword.verifyingEmail": "Verifying email...",
        "forgotPassword.sendingEmail": "Sending recovery email...",
        "forgotPassword.emailSentTitle": "Email sent",
        "forgotPassword.emailSentDescription":
          "A recovery email has been sent. Check your inbox (and spam). Redirecting to login...",
        "forgotPassword.emailNotRegisteredTitle": "Email not registered",
        "forgotPassword.emailNotRegisteredDescription":
          "No account found with this email address. Please verify the email or sign up.",

        // Reset Password
        "resetPassword.title": "Reset Password",
        "resetPassword.description":
          "Enter your new password to complete the recovery process.",
        "resetPassword.password": "New password",
        "resetPassword.confirmPassword": "Confirm password",
        "resetPassword.submit": "Update password",
        "resetPassword.loading": "Updating...",
        "resetPassword.success": "Password updated!",
        "resetPassword.successMessage":
          "Your password has been reset successfully.",
        "resetPassword.error": "Error resetting password",
        "resetPassword.passwordsDoNotMatch": "Passwords do not match.",
        "resetPassword.weakPassword":
          "Password is too weak. Use at least 6 characters.",
        "resetPassword.expiredLink":
          "The link has expired. Request a new link.",
        "resetPassword.invalidLink": "Invalid link. Request a new link.",
        "resetPassword.verifying": "Verifying link...",
        "resetPassword.invalidLinkError":
          "Invalid link. Request a new recovery link.",
        "resetPassword.expiredLinkError":
          "The recovery link has expired or is invalid. Request a new link.",
        "resetPassword.updatingPassword": "Updating password...",
        "resetPassword.successDescription":
          "Your password has been updated successfully. You will be redirected to login.",
        "resetPassword.redirectingMessage":
          "You will be redirected to login in 3 seconds...",

        // Login
        "login.verifyingCredentials": "Verifying credentials...",
        "login.signingIn": "Signing in...",
        "login.verifyingConfig": "Verifying configuration...",
        "login.emailNotRegistered":
          "The email address is not registered. Please sign up or verify your email.",

        // Onboarding
        "onboarding.title": "Welcome",
        "onboarding.description": "Set up your account to get started",
        "onboarding.timezone": "Timezone",
        "onboarding.selectTimezone": "Select your timezone",
        "onboarding.roles": "How will you use the app?",
        "onboarding.grower": "Grower",
        "onboarding.consumer": "Consumer",
        "onboarding.selectAtLeastOneRole": "Select at least one option",
        "onboarding.submit": "Continue",
        "onboarding.loading": "Saving...",
        "onboarding.success": "Settings saved!",
        "onboarding.successMessage":
          "Your account has been set up successfully",
        "onboarding.error": "Error saving settings",
        "onboarding.info":
          "This information helps us display dates and reminders in your timezone",

        // Dashboard
        "dashboard.title": "Dashboard",
        "dashboard.addPlant": "Add Plant",
        "dashboard.noPlants": "No plants",
        "dashboard.noPlantDesc": "Add your first plant to start tracking",
        "dashboard.error": "Error loading plants",
        "dashboard.reminders": "Reminders",
        "dashboard.yourPlants": "Your Plants",

        // New Plant
        "newPlant.title": "Add New Plant",
        "newPlant.description": "Enter your plant details",
        "newPlant.name": "Name",
        "newPlant.namePlaceholder": "e.g. Ultra Wonka, OG Kush, etc.",
        "newPlant.seedType": "Seed Type",
        "newPlant.autoflowering": "Autoflowering",
        "newPlant.photoperiodic": "Photoperiodic",
        "newPlant.growType": "Grow Type",
        "newPlant.indoor": "Indoor",
        "newPlant.outdoor": "Outdoor",
        "newPlant.plantingDate": "Planting Date",
        "newPlant.pickDate": "Pick a date",
        "newPlant.lightSchedule": "Light Schedule",
        "newPlant.selectLightSchedule": "Select a light schedule",
        "newPlant.lightSchedulePlaceholder": "e.g. 20/4, 18/6, 24/0, 12/12",
        "newPlant.vegetative": "Vegetative",
        "newPlant.flowering": "Flowering",
        "newPlant.submit": "Save Plant",
        "newPlant.loading": "Saving...",
        "newPlant.success": "Plant added!",
        "newPlant.successMessage": "Your plant has been added successfully",
        "newPlant.error": "Error adding plant",
        "newPlant.seedBank": "Seed Bank",
        "newPlant.seedBankPlaceholder":
          "e.g. Dutch Passion, Barney's Farm, etc.",
        "newPlant.photos": "Photos",

        // Plant Page
        "plantPage.details": "Details",
        "plantPage.journal": "Journal",
        "plantPage.environment": "Environment",
        "plantPage.photos": "Photos",
        "plantPage.notFound": "Plant not found",
        "plantPage.notFoundDesc":
          "The plant you're looking for doesn't exist or has been deleted",
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
        "plantPage.photoSuccessDesc":
          "Your photo has been uploaded successfully",
        "plantPage.photoError": "Error uploading photo",
        "plantPage.analyzePhoto": "Analyze Photo",
        "plantPage.analyzing": "Analyzing...",
        "plantPage.age": "Age",
        "plantPage.days": "days",
        "plantPage.lastWatering": "Last watering",
        "plantPage.noWateringRecords": "No watering records",
        "plantPage.lastFeeding": "Last feeding",
        "plantPage.noFeedingRecords": "No feeding records",
        "plantPage.lastTraining": "Last training",
        "plantPage.noTrainingRecords": "No training records",
        "plantPage.floweringAge": "Flowering age",
        "plantPage.noPhotos": "No photos",
        "plantPage.noPhotosDesc": "Add photos to your plant",

        // Settings
        "settings.title": "Settings",
        "settings.preferences": "Preferences",
        "settings.preferencesDesc": "Customize your experience",
        "settings.roles": "Roles",
        "settings.updated": "Settings updated",
        "settings.account": "Account",
        "settings.accountDesc": "Your account summary",
        "settings.language": "Language",
        "settings.timezone": "Timezone",
        "settings.selectTimezone": "Select your timezone",
        "settings.darkMode": "Dark Mode",
        "settings.timezoneUpdated": "Timezone updated",
        "settings.timezoneUpdatedDesc":
          "Your timezone has been updated successfully",
        "settings.darkModeUpdated": "Dark mode updated",
        "settings.darkModeOn": "Dark mode enabled",
        "settings.darkModeOff": "Dark mode disabled",
        "settings.error": "Error saving settings",
        "settings.dangerZone": "Danger Zone",
        "settings.dangerZoneDesc": "Irreversible actions",
        "settings.deleteAccount": "Delete Account",
        "settings.confirmDelete": "Are you sure?",
        "settings.confirmDeleteDesc": "This action cannot be undone.",
        // Plant Delete
        "plant.deleteTitle": "Delete plant",
        "plant.deleteDesc":
          "This action cannot be undone. The plant and its logs will be deleted.",
        "plant.deleteConfirm": "Delete plant",
        "settings.cancel": "Cancel",
        "settings.confirmDeleteButton": "Yes, delete my account",
        "settings.deleting": "Deleting...",
        "settings.accountDeleted": "Account deleted",
        "settings.accountDeletedDesc":
          "Your account has been deleted successfully",
        "settings.deleteError": "Error deleting account",
        "settings.enableNotifications": "Enable Notifications",
        "settings.reauthRequired":
          "For security, please sign in again and retry.",

        // Navigation
        "nav.dashboard": "Dashboard",
        "nav.addPlant": "Add Plant",
        "nav.journal": "Journal",
        "nav.settings": "Settings",
        "nav.signOut": "Sign Out",
        "nav.menu": "Navigation Menu",
        "nav.goToApp": "Go to app",

        // Journal
        "journal.title": "Grow Journal",
        "journal.description": "Track and view all your plant activities",
        "journal.loading": "Loading logs...",
        "journal.noEntries": "No entries",
        "journal.noEntriesDesc": "Add a log to start tracking",
        "journal.error": "Error loading logs",
        "journal.listView": "List View",
        "journal.calendarView": "Calendar View",
        "journal.filters": "Filters",
        "journal.filtersDesc": "Filter logs by plant, type and date",
        "journal.filterByPlant": "Filter by Plant",
        "journal.selectPlant": "Select a plant",
        "journal.allPlants": "All plants",
        "journal.filterByType": "Filter by Type",
        "journal.selectType": "Select a type",
        "journal.allTypes": "All types",
        "journal.filterByDate": "Filter by Date",
        "journal.clearDate": "Clear date",
        "journal.addLog": "Add Log",
        "journal.addLogDesc": "Record a new activity",
        "journal.recentLogs": "Recent Logs",
        "journal.logsFound": "logs found",
        "journal.calendarDesc": "View your logs in a calendar",
        "journal.logsFor": "Logs for",

        // Log Types
        "logType.watering": "Watering",
        "logType.feeding": "Feeding",
        "logType.training": "Training",
        "logType.environment": "Environment",
        "logType.flowering": "Switch to flowering",
        "logType.note": "Note",

        // Log Form
        "logForm.type": "Log Type",
        "logForm.date": "Date",
        "logForm.notes": "Notes",
        "logForm.submit": "Save Log",
        "logForm.loading": "Saving...",
        "logForm.success": "Log saved!",
        "logForm.successDesc": "The log has been saved successfully",
        "logForm.error": "Error saving log",
        "logForm.selectType": "Select a type",
        "logForm.selectDate": "Select a date",

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
        "environment.noData": "No data",
        "environment.noDataDesc": "No data available",

        // Common
        "common.error": "Error",
        "common.unknownError": "Unknown error",
        "common.fieldRequired": "This field is required",
        "common.success": "Success",
        "common.loading": "Loading...",
        "common.save": "Save",
        "common.cancel": "Cancel",
        "common.delete": "Delete",
        "common.edit": "Edit",
        "common.add": "Add",
        "common.confirm": "Confirm",
        "common.back": "Back",

        // Auth Errors
        "auth.error": "Authentication error",
        "auth.userNotFound": "User not found",
        "auth.wrongPassword": "Wrong password",
        "auth.emailAlreadyInUse": "Email already in use",
        "auth.weakPassword": "Password is too weak",
        "auth.invalidEmail": "Invalid email",
        "auth.incompleteEmail": "Please complete the email",
        "auth.tooManyRequests": "Too many attempts. Try again later",
        "auth.networkError": "Connection error. Check your internet",
        "auth.passwordTooShort": "Password is too short",

        // Firebase Errors
        "firebase.permissionDenied":
          "You don't have permission to perform this action",
        "firebase.unavailable": "Service unavailable. Try again later",
        "firebase.notFound": "Resource not found",

        // Validation
        "validation.error": "Validation error",
        "validation.unknownError": "Unknown validation error",
        "validation.required": "This field is required",
        "validation.invalidLightSchedule":
          "Invalid format. Use HH/HH, e.g. 20/4, 18/6, 24/0, 12/12",
        "validation.email": "Invalid email",
        "validation.password": "Password must be at least 6 characters",
        "validation.minLength": "Must be at least {min} characters",
        "validation.maxLength": "Must be at most {max} characters",
        "validation.minValue": "Must be greater than or equal to {min}",
        "validation.maxValue": "Must be less than or equal to {max}",
        "validation.invalidDate": "Invalid date",

        // Reminders
        "reminders.title": "Reminders",
        "reminders.description": "Manage reminders for your plants",
        "reminders.loading": "Loading reminders...",
        "reminders.add": "Add Reminder",
        "reminders.addReminder": "Add Reminder",
        "reminders.selectPlant": "Select a plant",
        "reminders.reminderType": "Reminder Type",
        "reminders.reminderTitle": "Title",
        "reminders.reminderDescription": "Description",
        "reminders.frequency": "Frequency",
        "reminders.interval": "Interval (days)",
        "reminders.daily": "Daily",
        "reminders.weekly": "Weekly",
        "reminders.custom": "Custom",
        "reminders.days": "days",
        "reminders.success": "Reminder added!",
        "reminders.successMessage":
          "Your reminder has been created successfully",
        "reminders.updated": "Reminder updated",
        "reminders.activated": "Reminder activated",
        "reminders.deactivated": "Reminder deactivated",
        "reminders.deleted": "Reminder deleted",
        "reminders.deletedMessage": "Your reminder has been deleted",
        "reminders.noReminders": "No reminders",
        "reminders.noRemindersDesc":
          "Add reminders to keep track of your plants",
        "reminders.overdue": "Overdue",
        "reminders.overdueDesc": "These reminders are overdue",
        "reminders.dueSoon": "Due soon",
        "reminders.dueSoonDesc": "Due in the next 24 hours",
        "reminders.markDone": "Done",
        "reminders.wateringTitle": "Water plant",
        "reminders.wateringDesc": "Time to water your plant",
        "reminders.feedingTitle": "Feed plant",
        "reminders.feedingDesc": "Time to feed your plant",
        "reminders.trainingTitle": "Train plant",
        "reminders.trainingDesc": "Time to train your plant",
        "reminders.customTitle": "Custom reminder",
        "reminders.customDesc": "Custom reminder",
        "reminders.noPlants": "No plants",
        "reminders.noPlantsDesc": "Add a plant to create reminders",
        "reminders.noPlantsHint": "Add a plant to create reminders",
        "reminders.pageDescription": "Manage reminders for your plants",

        // Strains (Consumer)
        "strains.title": "Strains",
        "strains.description": "Track your strains and consumption sessions.",
        "strains.addSession": "New session",
        "strains.required": "Strain is required",
        "strains.saved": "Session saved",
        "strains.noSessions": "No sessions",
        "strains.noSessionsDesc": "Create your first session to get started.",
        "strains.strain": "Strain",
        "strains.strainPlaceholder": "e.g. OG Kush",
        "strains.method": "Method",
        "strains.methodPlaceholder": "Pipe, Vape, Joint, Bong...",
        "strains.amount": "Amount",
        "strains.amountPlaceholder": "e.g. 0.3g",
        "strains.notes": "Notes",
        "strains.notesPlaceholder": "Effects, flavor, mood...",
        "strains.save": "Save",
        "strains.edit": "Edit",
        "strains.update": "Update",
        "strains.updated": "Session updated",
        "strains.delete": "Delete",
        "strains.deleted": "Session deleted",
        "strains.editSession": "Edit session",
        "strains.deleteConfirmTitle": "Delete session",
        "strains.deleteConfirmDesc":
          "This action cannot be undone. You will lose the saved information.",
        "strains.deleteConfirm": "Yes, delete",
        "strains.startTime": "Start time",
        "strains.endTime": "End time",
        "strains.photos": "Photos",

        // Favorites (Consumer)
        "favorites.filter": "Favorites",
        "favorites.added": "Added to favorites",
        "favorites.removed": "Removed from favorites",
        "favorites.only": "Favorites only",

        // Stash/Inventory (Consumer)
        "stash.title": "Stash",
        "stash.description": "Manage your flowers, concentrates and edibles",
        "stash.addItem": "Add item",
        "stash.name": "Name",
        "stash.type": "Type",
        "stash.types.flower": "Flower",
        "stash.types.concentrate": "Concentrate",
        "stash.types.edible": "Edible",
        "stash.amount": "Amount",
        "stash.unit": "Unit",
        "stash.units.g": "g",
        "stash.units.ml": "ml",
        "stash.units.units": "units",
        "stash.thc": "% THC",
        "stash.cbd": "% CBD",
        "stash.addedAt": "Purchase date",
        "stash.vendor": "Vendor",
        "stash.price": "Price",
        "stash.notes": "Notes",
        "stash.save": "Save",
        "stash.update": "Update",
        "stash.delete": "Deleted",
        "stash.empty": "No items",
        "stash.emptyDesc": "Add your first item to get started",
        "stash.saved": "Stash saved",
        "stash.savedDesc": "The item was saved successfully",
        "stash.updated": "Stash updated",
        "stash.updatedDesc": "The item was updated successfully",
        "stash.nameRequired": "Name is required",
        "stash.amountRequired": "Amount is required",
        "stash.requiredHint":
          "Name and amount are required. Others are optional.",

        // Add chooser (mobile +)
        "addChooser.title": "What would you like to add?",
        "addChooser.plant": "New plant",
        "addChooser.session": "New session",

        // Home chooser (mobile home when both roles)
        "homeChooser.title": "Where do you want to go?",
        "homeChooser.dashboard": "Grower dashboard",
        "homeChooser.sessions": "Sessions",

        // Notifications
        "notifications.enable": "Enable notifications",
        "notifications.enabled": "Notifications enabled",
        "notifications.permissionDenied": "Permission denied",
        "notifications.missingVapid": "Missing public VAPID key",
        "notifications.unsupported":
          "Notifications not supported in this browser",
        "notifications.tokenFailed": "Failed to obtain notification token",
        "notifications.unknown": "Could not enable",
        "notifications.tokenCopied": "Token copied to clipboard",

        // Search
        "search.placeholder": "Search plants, logs...",
        "search.noResults": "No results found",
        "search.searching": "Searching...",

        // Plant Card
        "plantCard.lastWatering": "Last watering",
        "plantCard.noWateringRecords": "No watering records",
        "plantCard.lastFeeding": "Last feeding",
        "plantCard.noFeedingRecords": "No feeding records",
        "plantCard.lastTraining": "Last training",
        "plantCard.noTrainingRecords": "No training records",

        // Photos
        "photos.title": "Photos",
        "photos.photo": "photo",
        "photos.photos": "photos",
        "photos.addPhotos": "Add Photos",
        "photos.uploadPhotos": "Upload Photos",
        "photos.noPhotos": "No photos",
        "photos.noPhotosDesc": "Add photos to document your plant's growth",
        "photos.addFirstPhoto": "Add First Photo",
        "photos.plantPhoto": "Plant photo",
        "photos.uploadSuccess": "Photos uploaded!",
        "photos.photosUpdated": "Photos have been updated successfully",
        "photos.uploadError": "Error uploading photos",
        "photos.removeSuccess": "Photo removed",
        "photos.photoRemoved": "Photo has been removed successfully",
        "photos.removeError": "Error removing photo",

        // Cover Photo
        "photos.setAsCover": "Set as cover",
        "photos.coverPhotoSet": "Cover photo set!",
        "photos.coverPhotoSetDesc":
          "This photo will be displayed on the plant card",
        "photos.coverPhotoError": "Error setting cover photo",
        "photos.coverSet": "Cover set!",
        "plantCard.coverPhoto": "Cover photo",
        "photos.setCoverConfirmTitle": "Set as cover",
        "photos.setCoverConfirmDesc":
          "Do you want to set this photo as the plant's cover?",

        // Image Upload
        "imageUpload.dragDrop": "Drag and drop images here",
        "imageUpload.orClick": "or click to select",
        "imageUpload.selectImages": "Select Images",
        "imageUpload.uploading": "Uploading...",
        "imageUpload.allowedTypes": "Allowed types:",
        "imageUpload.maxSize": "Max size:",
        "imageUpload.maxImages": "Max images:",
        "imageUpload.preview": "Preview",
        "imageUpload.image": "image",
        "imageUpload.invalidType": "Invalid file type. Allowed types:",
        "imageUpload.tooLarge": "File too large. Maximum:",
        "imageUpload.tooManyImages": "Too many images",
        "imageUpload.maxImagesReached":
          "You have reached the maximum number of images",
        "imageUpload.validationErrors": "Validation errors",
        "imageUpload.uploadError": "Upload error",
        "imageUpload.uploadFailed": "Failed to upload image",
        "imageUpload.uploadSuccess": "Images uploaded!",
        "imageUpload.imagesUploaded": "images uploaded successfully",

        // Gallery
        "gallery.image": "Image",
        "gallery.thumbnail": "Thumbnail",

        // Image Errors
        "imageErrors.userNotAuthenticated": "User not authenticated",
        "imageErrors.fileTooLarge": "File is too large",
        "imageErrors.invalidFileType": "Invalid file type",
        "imageErrors.uploadFailed": "Failed to upload file",
      };

      setTranslations({
        es: esTranslations,
        en: enTranslations,
      });

      setIsLoaded(true);
    };

    loadTranslations();

    // Check if user has a preferred language stored
    const storedLanguage = localStorage.getItem("language") as Language;
    if (
      storedLanguage &&
      (storedLanguage === "es" || storedLanguage === "en")
    ) {
      setLanguage(storedLanguage);
    }
  }, []);

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem("language", language);

    // Update HTML lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    if (!isLoaded) return key;

    const currentTranslations = translations[language] || {};
    return currentTranslations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
