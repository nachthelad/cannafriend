import "react-i18next";

// Import the actual translation files for type inference
import commonEs from "../lib/locales/es/common.json";
import commonEn from "../lib/locales/en/common.json";

// Extend the react-i18next module to provide type safety
declare module "react-i18next" {
  interface CustomTypeOptions {
    // Set the default namespace
    defaultNS: "common";
    
    // Define the structure of our resources
    resources: {
      common: typeof commonEs; // Use Spanish as the reference for structure
    };
    
    // Allow return type to be string
    returnNull: false;
    returnEmptyString: false;
    returnObjects: false;
  }
}

// Export types for use in other files
export type TranslationKey = keyof typeof commonEs;
export type Language = "es" | "en";