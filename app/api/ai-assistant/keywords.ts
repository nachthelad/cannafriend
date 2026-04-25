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

/**
 * Detect questions about the assistant's own rules, instructions, or capabilities.
 * These are always refused regardless of conversation context.
 */
export function isMetaQuestion(text: string): boolean {
  const t = (text || "").toLowerCase();
  const patterns = [
    // Spanish — asking about rules/instructions
    /tus\s+(reglas?|instrucciones?|limitaciones?|restricciones?|normas?|directrices?)/,
    // Spanish — asking what the bot can/cannot do
    /qu[eé]\s+(pod[eé]s|pued[ae]s|est[áa]s?\s+autorizado|ten[eé]s?\s+permitido)/,
    /qu[eé]\s+cosas?\s+(pod[eé]s?|pued[ae]s?)\s+(hacer|responder|contestar|decir)/,
    /qu[eé]\s+(te\s+)?(permite|dejan|está\s+permitido|podés\s+hacer)/,
    /cu[aá]les?\s+son\s+tus\s+(reglas?|instrucciones?|l[ií]mites?)/,
    /para\s+qu[eé]\s+(est[áa]s|sirv[eé]s|fuiste\s+programado)/,
    /c[oó]mo\s+(te\s+)?(programaron|configuraron|entrenaron)/,
    // English — asking about rules/instructions
    /your\s+(rules?|instructions?|limitations?|restrictions?|guidelines?|prompt|configuration|training)/,
    /what\s+(can|are|were)\s+you\s+(do|doing|allowed|permitted|trained|programmed|designed)/,
    /what\s+are\s+your\s+(rules?|instructions?|limits?|restrictions?|guidelines?)/,
    /what\s+(things?\s+)?(can|do)\s+you\s+(do|answer|respond|say)/,
    /what\s+are\s+you\s+(allowed|supposed|designed|built|made)\s+to/,
    /how\s+were\s+you\s+(trained|programmed|configured|built)/,
    // Universal — system prompt
    /system\s*prompt/,
    /prompt\s+del?\s+sistema/,
  ];
  return patterns.some((p) => p.test(t));
}