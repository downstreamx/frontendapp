import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

export type PaginatedListMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

type PaginationProps = {
  data: PaginatedListMeta
  onPageChange?: (page: number) => void
}

export function Pagination({ data, onPageChange }: PaginationProps) {
  const { t } = useTranslation()
  const { current_page, last_page, from, to, total } = data

  const goToPage = (page: number) => {
    if (page < 1 || page > last_page || page === current_page) return
    onPageChange?.(page)
  }

  const renderPageNumbers = () => {
    const pages: ReactNode[] = []
    const showPages = 5
    let startPage = Math.max(1, current_page - Math.floor(showPages / 2))
    let endPage = Math.min(last_page, startPage + showPages - 1)

    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1)
    }

    if (startPage > 1) {
      pages.push(
        <Button key={1} variant="outline" size="sm" onClick={() => goToPage(1)}>
          1
        </Button>,
      )
      if (startPage > 2) {
        pages.push(<MoreHorizontal key="start-ellipsis" className="h-4 w-4" />)
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === current_page ? 'default' : 'outline'}
          size="sm"
          onClick={() => goToPage(i)}
        >
          {i}
        </Button>,
      )
    }

    if (endPage < last_page) {
      if (endPage < last_page - 1) {
        pages.push(<MoreHorizontal key="end-ellipsis" className="h-4 w-4" />)
      }
      pages.push(
        <Button key={last_page} variant="outline" size="sm" onClick={() => goToPage(last_page)}>
          {last_page}
        </Button>,
      )
    }

    return pages
  }

  if (last_page <= 1 && total === 0) {
    return null
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-2 py-4 sm:flex-row">
      <div className="text-xs text-muted-foreground sm:text-sm">
        {t('Showing')} {from} {t('to')} {to} {t('of')} {total} {t('results')}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1 sm:space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(current_page - 1)}
          disabled={current_page === 1}
          className="h-8"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{t('Previous')}</span>
        </Button>
        {renderPageNumbers()}
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(current_page + 1)}
          disabled={current_page === last_page}
          className="h-8"
        >
          <span className="hidden sm:inline">{t('Next')}</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
