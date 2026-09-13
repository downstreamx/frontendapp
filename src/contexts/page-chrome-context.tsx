import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

export function PageChromeProvider({ children }: { children: ReactNode }) {
  const [chrome, setChromeState] = useState<PageChrome>({})
  const location = useLocation()

  const setChrome = useCallback((next: PageChrome) => {
    setChromeState((prev) => (chromeEquals(prev, next) ? prev : next))
  }, [])

  useEffect(() => {
    setChromeState({})
  }, [location.pathname])

  const value = useMemo(() => ({ chrome, setChrome }), [chrome, setChrome])

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

export function usePageChromeState(): PageChrome {
  return useContext(PageChromeContext)?.chrome ?? {}
}
