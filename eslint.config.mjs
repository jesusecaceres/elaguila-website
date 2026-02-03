// eslint.config.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // Ignore build output
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },

  // Base recommended rules
  js.configs.recommended,

  // Next.js recommended + TypeScript rules (compat layer)
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
