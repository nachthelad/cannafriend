/**
 * Cannabis-related keywords for topic detection
 * Supports both Spanish and English terms
 */

export const CANNABIS_KEYWORDS = [
  // === SPANISH KEYWORDS ===

  // Basic cannabis terms
  "cannabis",
  "marihuana",
  "hierba",
  "porro",
  "vape",
  "cogollo",
  "cogollos",

  // Cultivation terms
  "cultivo",
  "cultivos",
  "crecimiento",
  "crecer",
  "crezca",
  "crezcan",
  "cultivar",
  "cultivando",

  // Plant parts and health
  "planta",
  "plantas",
  "tallo",
  "talle",
  "fuerte",
  "fuertes",
  "resistente",
  "sana",
  "sanas",
  "saludable",
  "hoja",
  "hojas",
  "raíz",
  "raices",
  "ramas",
  "rama",

  // Growing equipment and environment
  "maceta",
  "macetas",
  "transplante",
  "trasplante",
  "tierra",
  "sustrato",
  "indoor",
  "outdoor",
  "led",
  "luz",
  "luces",
  "iluminacion",
  "temperatura",
  "humedad",
  "ventilacion",
  "aire",

  // Nutrients and feeding
  "nutriente",
  "nutrientes",
  "fertilizante",
  "fertilizantes",
  "abono",
  "riego",
  "regado",
  "ph",
  "ec",

  // Seeds and genetics
  "semilla",
  "semillas",
  "germinacion",
  "banco",
  "bancos",
  "genetica",
  "banco de semillas",
  "strain",
  "frozen",
  "lemon",
  "insaseeds",

  // Problems and pests
  "plaga",
  "plagas",
  "moho",
  "deficiencia",
  "deficiencias",

  // Cannabinoids and terpenes
  "thc",
  "cbd",
  "terpeno",
  "terpenos",

  // === ENGLISH KEYWORDS ===

  // Basic cannabis terms
  "weed",
  "marijuana",
  "herb",
  "bud",
  "buds",
  "joint",
  "vape",
  "vaping",

  // Cultivation terms
  "grow",
  "growing",
  "cultivation",
  "cultivate",
  "cultivating",
  "growth",

  // Plant parts and health
  "plant",
  "plants",
  "stem",
  "stems",
  "strong",
  "healthy",
  "leaf",
  "leaves",
  "root",
  "roots",
  "branch",
  "branches",

  // Growing equipment and environment
  "pot",
  "pots",
  "container",
  "containers",
  "transplant",
  "transplanting",
  "soil",
  "substrate",
  "medium",
  "light",
  "lights",
  "lighting",
  "temperature",
  "humidity",
  "ventilation",
  "air",
  "airflow",

  // Nutrients and feeding
  "nutrient",
  "nutrients",
  "fertilizer",
  "fertilizers",
  "feeding",
  "watering",
  "irrigation",

  // Seeds and genetics
  "seed",
  "seeds",
  "germination",
  "seedbank",
  "genetics",
  "strain",
  "strains",
  "variety",
  "varieties",

  // Growth stages
  "veg",
  "vegetative",
  "flowering",
  "flower",
  "bloom",
  "harvest",
  "harvesting",

  // Problems and pests
  "pest",
  "pests",
  "mold",
  "mould",
  "deficiency",
  "deficiencies",
  "disease",
  "problem",
  "issue",

  // Measurements and technical
  "vpd",
  "ppm",
  "ec",
  "ph",
  "ppfd",
  "par",
] as const;

/**
 * Context keywords for conversation-level cannabis detection
 * These establish cannabis context that persists through the conversation
 */
export const CONTEXT_KEYWORDS = [
  // High-confidence cannabis indicators
  "cannabis",
  "marihuana",
  "cultivo",
  "cultivos",
  "planta",
  "plantas",
  "weed",
  "marijuana",
  "grow",
  "growing",

  // Seed banks and strains (strong indicators)
  "insaseeds",
  "banco de semillas",
  "seedbank",
  "frozen lemon",
  "strain",
  "genetics",

  // Specific cultivation terms
  "transplante",
  "transplant",
  "maceta",
  "pot",
  "indoor",
  "outdoor",
  "led",
  "nutrientes",
  "nutrients",
] as const;

/**
 * Check if text contains cannabis-related keywords
 */
export function isCannabisRelated(text: string): boolean {
  const t = (text || "").toLowerCase();
  return CANNABIS_KEYWORDS.some((keyword) => t.includes(keyword));
}

/**
 * Check if conversation has established cannabis context
 */
export function isContextuallyOnTopic(messages: Array<{ content: string }>): boolean {
  const conversationText = messages
    .map((m) => m.content)
    .join(" ")
    .toLowerCase();

  return CONTEXT_KEYWORDS.some((keyword) => conversationText.includes(keyword));
}