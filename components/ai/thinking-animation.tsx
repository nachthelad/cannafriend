"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

interface ThinkingAnimationProps {
  className?: string;
}

export function ThinkingAnimation({ className = "" }: ThinkingAnimationProps) {
  const { i18n } = useTranslation();
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [dots, setDots] = useState("");

  // Thinking phrases in both languages
  const phrases = {
    es: [
      "Analizando plantas",
      "Verificando esquejes",
      "Evaluando nutrientes",
      "Diagnosticando hojas",
      "Revisando crecimiento",
      "Calculando dosificación",
      "Analizando síntomas",
      "Verificando ambiente",
      "Evaluando genética",
      "Revisando sustrato",
      "Analizando terpenos",
      "Verificando pH",
      "Evaluando luz",
      "Diagnosticando raíces",
      "Revisando humedad",
      "Chequeando tricomas",
      "Analizando deficiencias",
      "Verificando plagas",
      "Evaluando riego",
      "Revisando ventilación",
      "Calculando EC",
      "Analizando floración",
      "Verificando cosecha",
      "Evaluando cepas",
      "Revisando transplante",
    ],
    en: [
      "Analyzing plants",
      "Checking clones",
      "Evaluating nutrients",
      "Diagnosing leaves",
      "Reviewing growth",
      "Calculating dosage",
      "Analyzing symptoms",
      "Checking environment",
      "Evaluating genetics",
      "Reviewing substrate",
      "Analyzing terpenes",
      "Checking pH",
      "Evaluating light",
      "Diagnosing roots",
      "Reviewing humidity",
      "Checking trichomes",
      "Analyzing deficiencies",
      "Checking pests",
      "Evaluating watering",
      "Reviewing ventilation",
      "Calculating EC",
      "Analyzing flowering",
      "Checking harvest",
      "Evaluating strains",
      "Reviewing transplant",
    ],
  };

  const currentLanguage = i18n.language === "es" ? "es" : "en";
  const currentPhrases = phrases[currentLanguage];

  // Rotate phrases every 1.8 seconds
  useEffect(() => {
    const phraseInterval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % currentPhrases.length);
    }, 1800);

    return () => clearInterval(phraseInterval);
  }, [currentPhrases.length]);

  // Animate dots every 400ms
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 400);

    return () => clearInterval(dotInterval);
  }, []);

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Thinking text with fade transition */}
      <div className="flex-1 min-w-0">
        <span className="text-sm text-muted-foreground font-medium transition-opacity duration-300">
          {currentPhrases[currentPhraseIndex]}
          <span className="inline-block w-8 text-left">{dots}</span>
        </span>
      </div>
    </div>
  );
}
