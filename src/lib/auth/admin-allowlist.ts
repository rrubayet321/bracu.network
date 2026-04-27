/**
 * Admin allowlist from ADMIN_EMAILS (comma-separated, case-insensitive).
 * Used by middleware, server pages, and server actions — keep in sync.
 * If empty, no one is treated as admin (fail closed).
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  const allowed = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length === 0) return false;
  const normalized = (email ?? '').trim().toLowerCase();
  if (!normalized) return false;
  return allowed.includes(normalized);
}
