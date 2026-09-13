import { useCallback, useEffect, useState } from 'react'
import type { NavItem } from '@/types'
import { MEGA_MENU_TILE_WIDTH } from './mega-menu-item'

const TILE_MIN_WIDTH = MEGA_MENU_TILE_WIDTH
const MORE_TILE_WIDTH = MEGA_MENU_TILE_WIDTH

type UseMegaMenuOverflowOptions = {
  items: NavItem[]
  containerRef: React.RefObject<HTMLElement | null>
  enabled?: boolean
}

type UseMegaMenuOverflowResult = {
  visibleItems: NavItem[]
  overflowItems: NavItem[]
  showMore: boolean
}

export function useMegaMenuOverflow({
  items,
  containerRef,
  enabled = true,
}: UseMegaMenuOverflowOptions): UseMegaMenuOverflowResult {
  const [visibleCount, setVisibleCount] = useState(items.length)

  const calculateVisibleCount = useCallback(() => {
    if (!enabled || !containerRef.current) {
      setVisibleCount(items.length)
      return
    }

    const width = containerRef.current.clientWidth
    if (width <= 0) {
      return
    }

    const maxWithoutMore = Math.floor(width / TILE_MIN_WIDTH)
    if (maxWithoutMore >= items.length) {
      setVisibleCount(items.length)
      return
    }

    const maxWithMore = Math.floor((width - MORE_TILE_WIDTH) / TILE_MIN_WIDTH)
    setVisibleCount(Math.max(1, maxWithMore))
  }, [containerRef, enabled, items.length])

  useEffect(() => {
    calculateVisibleCount()

    if (!enabled || !containerRef.current) {
      return
    }

    const observer = new ResizeObserver(() => {
      calculateVisibleCount()
    })

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [calculateVisibleCount, containerRef, enabled])

  useEffect(() => {
    calculateVisibleCount()
  }, [items, calculateVisibleCount])

  const showMore = visibleCount < items.length
  const visibleItems = showMore ? items.slice(0, visibleCount) : items
  const overflowItems = showMore ? items.slice(visibleCount) : []

  return { visibleItems, overflowItems, showMore }
}
