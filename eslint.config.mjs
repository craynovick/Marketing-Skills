import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  { ignores: [".next/**", "node_modules/**", "packages/*/dist/**", "app/.well-known/workflow/**"] },
  {
    files: ["**/*.{jsx,tsx}"],
    rules: {
      // Existing client components predate these stricter rules. Keep them visible
      // in CI without blocking this release; migrate each surface incrementally.
      "@next/next/no-html-link-for-pages": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
];

export default config;
