import { withWorkflow } from "workflow/next";
import type { NextConfig } from "next";
const nextConfig: NextConfig = { output: "standalone", outputFileTracingIncludes: { "/api/skills/install": ["./packages/cookbook-installer/install.mjs", "./content/skills/**/*"], "/api/cookbook/brand-packs/*/download": ["./packages/cookbook-installer/install.mjs", "./content/skills/**/*"] } };
export default withWorkflow(nextConfig);
