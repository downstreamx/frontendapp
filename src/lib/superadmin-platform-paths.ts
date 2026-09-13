/** Paths reserved for platform (super admin) management — not tenant self-service UIs. */
export const SUPERADMIN_EXCLUSIVE_PATH_PREFIXES = [
  '/coupons',
  '/email-templates',
  '/notification-templates',
  '/modules',
  '/add-ons',
  '/landing-page',
] as const

export function isSuperAdminExclusivePath(pathname: string): boolean {
  return SUPERADMIN_EXCLUSIVE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}
