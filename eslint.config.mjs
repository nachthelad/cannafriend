// Flat ESLint config for ESLint v9 and VSCode integration
// Bridges existing Next.js config while keeping current rules.
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: process.cwd() });

export default [
  // Bring in Next.js recommended + TypeScript support via compat layer
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Project-specific tweaks (mirrors .eslintrc.json rules)
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@next/next/no-img-element": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // Ignores
  {
    ignores: ["**/.next/**", "**/node_modules/**", "coverage/**"],
  },
];

