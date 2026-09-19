export type Entitlements = { admin: boolean; unlimited: boolean; tuning: boolean };

function configuredAdminEmails() {
  return (process.env.ADMIN_EMAILS || "").split(",").map(email => email.trim().toLowerCase()).filter(Boolean);
}

export function entitlementsForUser(user: { email?: string | null; app_metadata?: Record<string, unknown> | null }): Entitlements {
  const metadata = user.app_metadata || {};
  const admin = metadata.role === "admin" || configuredAdminEmails().includes((user.email || "").toLowerCase());
  return { admin, unlimited: admin || metadata.unlimited === true, tuning: admin || metadata.tuning === true };
}
