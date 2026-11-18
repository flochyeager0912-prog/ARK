import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: [".next/**", ".next-*/**", "preview-out/**", "e2e-output/**", "node_modules/**", "next-env.d.ts"] },
];
export default config;
