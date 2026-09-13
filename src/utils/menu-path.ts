/** Normalize menu href to pathname for active-state checks. */
export function menuPathname(href: string): string {
  try {
    return new URL(href, window.location.origin).pathname.replace(/\/+$/, '') || '/'
  } catch {
    return href.replace(/\/+$/, '') || '/'
  }
}

/**
 * Legacy sidebar treats a link as active on exact match; parent sections stay open when
 * any child path matches. Also match nested SPA routes (e.g. /inventory/products/1/edit).
 */
export function isMenuPathActive(
  pathname: string,
  href?: string,
  options?: { matchExact?: boolean },
): boolean {
  if (!href) return false

  const target = menuPathname(href)
  const current = pathname.replace(/\/+$/, '') || '/'

  if (current === target) return true

  if (options?.matchExact) return false

  if (target !== '/' && current.startsWith(`${target}/`)) {
    return true
  }

  return false
}

export function isMenuBranchActive(
  pathname: string,
  children: { href?: string; children?: unknown[]; matchExact?: boolean }[],
): boolean {
  return children.some((child) => {
    if (
      'href' in child &&
      isMenuPathActive(pathname, child.href as string | undefined, {
        matchExact: child.matchExact,
      })
    ) {
      return true
    }
    if (child.children && Array.isArray(child.children)) {
      return isMenuBranchActive(
        pathname,
        child.children as { href?: string; children?: unknown[]; matchExact?: boolean }[],
      )
    }
    return false
  })
}
