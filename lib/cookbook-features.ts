/** Enable only after the additive migration and configured-preview checks pass. */
export const cookbookV2Enabled = () => process.env.COOKBOOK_V2_ENABLED === "true";

/** Disable new brand creation and adaptations independently during rollout. */
export const cookbookBrandsEnabled = () => process.env.COOKBOOK_BRANDS_ENABLED === "true";
