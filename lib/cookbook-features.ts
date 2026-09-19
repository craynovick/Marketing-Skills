/** Enable only after the additive migration and configured-preview checks pass. */
export const cookbookV2Enabled = () => process.env.COOKBOOK_V2_ENABLED === "true";
