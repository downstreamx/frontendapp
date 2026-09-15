import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'

export type Breadcrumb = { label: string; url?: string; href?: string }

type PageChrome = {
  breadcrumbs?: Breadcrumb[]
  pageTitle?: string
  pageActions?: ReactNode
  centerPageTitle?: boolean
}

type PageChromeContextValue = {
  chrome: PageChrome
  setChrome: (chrome: PageChrome) => void
  contentTitles: ReadonlyMap<string, string>
  registerContentTitle: (id: string, title: string) => void
  unregisterContentTitle: (id: string) => void
}

const PageChromeContext = createContext<PageChromeContextValue | null>(null)

function breadcrumbKey(breadcrumbs?: Breadcrumb[]): string {
  return breadcrumbs?.map((c) => `${c.label}:${c.url ?? ''}`).join('|') ?? ''
}

function chromeEquals(a: PageChrome, b: PageChrome): boolean {
  return (
    a.pageTitle === b.pageTitle &&
    a.pageActions === b.pageActions &&
    a.centerPageTitle === b.centerPageTitle &&
    breadcrumbKey(a.breadcrumbs) === breadcrumbKey(b.breadcrumbs)
  )
}

/** Normalize for comparing chrome vs in-content headings. */
export function pageTitlesMatch(a?: string | null, b?: string | null): boolean {
  if (a == null || b == null) return false
  const left = a.trim().toLocaleLowerCase()
  const right = b.trim().toLocaleLowerCase()
  return left.length > 0 && left === right
}

export function PageChromeProvider({ children }: { children: ReactNode }) {
  const [chrome, setChromeState] = useState<PageChrome>({})
  const [contentTitles, setContentTitles] = useState<ReadonlyMap<string, string>>(() => new Map())
  const location = useLocation()

  const setChrome = useCallback((next: PageChrome) => {
    setChromeState((prev) => (chromeEquals(prev, next) ? prev : next))
  }, [])

  const registerContentTitle = useCallback((id: string, title: string) => {
    setContentTitles((prev) => {
      if (prev.get(id) === title) return prev
      const next = new Map(prev)
      next.set(id, title)
      return next
    })
  }, [])

  const unregisterContentTitle = useCallback((id: string) => {
    setContentTitles((prev) => {
      if (!prev.has(id)) return prev
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  useEffect(() => {
    setChromeState({})
    setContentTitles(new Map())
  }, [location.pathname])

  const value = useMemo(
    () => ({
      chrome,
      setChrome,
      contentTitles,
      registerContentTitle,
      unregisterContentTitle,
    }),
    [chrome, setChrome, contentTitles, registerContentTitle, unregisterContentTitle],
  )

  return <PageChromeContext.Provider value={value}>{children}</PageChromeContext.Provider>
}

export function usePageChrome(chrome: PageChrome | null) {
  const setChrome = useContext(PageChromeContext)?.setChrome
  const key = chrome
    ? `${chrome.pageTitle ?? ''}|${chrome.centerPageTitle ? '1' : '0'}|${breadcrumbKey(chrome.breadcrumbs)}`
    : ''
  const chromeRef = useRef(chrome)
  chromeRef.current = chrome

  useEffect(() => {
    if (!setChrome || chrome == null) return
    setChrome(chromeRef.current)
    return () => setChrome({})
  }, [key, setChrome])
}

/**
 * Register an in-content heading. When it matches chrome `pageTitle`, the layout
 * hides the outer title so only the content heading remains.
 */
export function useRegisterContentTitle(title: string | undefined | null) {
  const registerContentTitle = useContext(PageChromeContext)?.registerContentTitle
  const unregisterContentTitle = useContext(PageChromeContext)?.unregisterContentTitle
  const id = useId()

  useLayoutEffect(() => {
    if (!registerContentTitle || !unregisterContentTitle || title == null || title.trim() === '') {
      return
    }
    registerContentTitle(id, title)
    return () => unregisterContentTitle(id)
  }, [registerContentTitle, unregisterContentTitle, id, title])
}

export function usePageChromeState(): PageChrome {
  return useContext(PageChromeContext)?.chrome ?? {}
}

export function useContentTitleMatchesPageTitle(pageTitle?: string | null): boolean {
  const contentTitles = useContext(PageChromeContext)?.contentTitles
  if (!pageTitle || !contentTitles || contentTitles.size === 0) return false
  for (const title of contentTitles.values()) {
    if (pageTitlesMatch(pageTitle, title)) return true
  }
  return false
}

function textFromReactNode(node: ReactNode): string | undefined {
  if (node == null || typeof node === 'boolean') return undefined
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) {
    const parts = node.map(textFromReactNode).filter((part): part is string => part != null)
    return parts.length > 0 ? parts.join('') : undefined
  }
  return undefined
}

/** Extract plain-text title from typical heading children (`t('…')`, fragments). */
export function contentTitleFromChildren(children: ReactNode): string | undefined {
  const text = textFromReactNode(children)?.trim()
  return text || undefined
}
