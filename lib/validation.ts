import { z } from "zod";

// Plant validation schema
export const plantSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(50, "El nombre debe tener máximo 50 caracteres"),

  seedType: z.enum(["autofloreciente", "fotoperiodica"], {
    required_error: "El tipo de semilla es requerido",
  }),
  growType: z.enum(["indoor", "outdoor"], {
    required_error: "El tipo de cultivo es requerido",
  }),
  plantingDate: z.string().min(1, "La fecha de plantación es requerida"),
  lightSchedule: z.string().nullable().optional(),
});

// Log entry validation schema
export const logEntrySchema = z.object({
  type: z.enum(["watering", "feeding", "training", "environment", "note"], {
    required_error: "El tipo de registro es requerido",
  }),
  date: z.string().min(1, "La fecha es requerida"),
  notes: z.string().optional(),

  // Watering specific
  amount: z.number().min(0, "La cantidad debe ser mayor a 0").optional(),
  method: z.string().optional(),

  // Feeding specific
  npk: z.string().optional(),

  // Training specific
  trainingMethod: z.string().optional(),

  // Environment specific
  temperature: z
    .number()
    .min(-50, "Temperatura inválida")
    .max(100, "Temperatura inválida")
    .optional(),
  humidity: z
    .number()
    .min(0, "Humedad inválida")
    .max(100, "Humedad inválida")
    .optional(),
  ph: z.number().min(0, "pH inválido").max(14, "pH inválido").optional(),
  light: z.number().min(0, "Intensidad de luz inválida").optional(),
});

// User settings validation schema
export const userSettingsSchema = z.object({
  timezone: z.string().min(1, "La zona horaria es requerida"),
  darkMode: z.boolean().default(false),
});

// Validation helper functions
export const validatePlant = (data: any) => {
  try {
    return { success: true, data: plantSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return {
      success: false,
      errors: [{ message: "Error de validación desconocido" }],
    };
  }
};

export const validateLogEntry = (data: any) => {
  try {
    return { success: true, data: logEntrySchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return {
      success: false,
      errors: [{ message: "Error de validación desconocido" }],
    };
  }
};

export const validateUserSettings = (data: any) => {
  try {
    return { success: true, data: userSettingsSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return {
      success: false,
      errors: [{ message: "Error de validación desconocido" }],
    };
  }
};

// Field validation helpers
export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string) => {
  return password.length >= 6;
};

export const validateRequired = (value: any, fieldName: string) => {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return `${fieldName} es requerido`;
  }
  return null;
};

export const validateNumber = (
  value: any,
  fieldName: string,
  min?: number,
  max?: number
) => {
  const num = Number(value);
  if (isNaN(num)) {
    return `${fieldName} debe ser un número`;
  }
  if (min !== undefined && num < min) {
    return `${fieldName} debe ser mayor o igual a ${min}`;
  }
  if (max !== undefined && num > max) {
    return `${fieldName} debe ser menor o igual a ${max}`;
  }
  return null;
};

export const validateDate = (date: any, fieldName: string) => {
  if (!date) {
    return `${fieldName} es requerido`;
  }
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return `${fieldName} debe ser una fecha válida`;
  }
  return null;
};
