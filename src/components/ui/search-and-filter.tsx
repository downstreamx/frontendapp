import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { FilterButton } from '@/components/ui/filter-button'
import { SearchInput } from '@/components/ui/search-input'
import { SectionPanel } from '@/components/ui/section-panel'
import { cn } from '@/lib/utils'

export type SearchAndFilterProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  onSearch: (cleared?: boolean) => void
  searchPlaceholder?: string
  showFilters?: boolean
  onToggleFilters?: () => void
  activeFilterCount?: number
  /** Per-page selector, list/grid toggle, etc. */
  controls?: ReactNode
  /** Advanced filter fields (shown when `showFilters` is true). */
  children?: ReactNode
  onApplyFilters?: () => void
  onClearFilters?: () => void
  showFilterActions?: boolean
}

/** Legacy list toolbar: search row + collapsible filter panel. */
export function SearchAndFilter({
  searchValue,
  onSearchChange,
  onSearch,
  searchPlaceholder,
  showFilters = false,
  onToggleFilters = () => {},
  activeFilterCount = 0,
  controls,
  children,
  onApplyFilters,
  onClearFilters,
  showFilterActions = true,
}: SearchAndFilterProps) {
  const { t } = useTranslation()

  return (
    <div className="mx-6 mb-6">
      <SectionPanel
        className={cn(
          'rounded-none border-x-0 border-t-0 p-4 md:p-4',
          showFilters && children && 'rounded-b-none border-b-0',
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="max-w-md flex-1">
            <SearchInput
              value={searchValue}
              onChange={onSearchChange}
              onSearch={onSearch}
              placeholder={searchPlaceholder}
              className="w-full"
            />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {controls}
            <div className="relative">
              <FilterButton showFilters={showFilters} onToggle={onToggleFilters} />
              {activeFilterCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </SectionPanel>

      {showFilters && children && (
        <SectionPanel className="rounded-none border-x-0 border-t-0 rounded-t-none p-4 md:p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">{children}</div>
          {showFilterActions && (onApplyFilters || onClearFilters) && (
            <div className="mt-4 flex items-center gap-2">
              {onApplyFilters && (
                <Button type="button" size="sm" onClick={onApplyFilters}>
                  {t('Apply')}
                </Button>
              )}
              {onClearFilters && (
                <Button type="button" variant="outline" size="sm" onClick={onClearFilters}>
                  {t('Clear')}
                </Button>
              )}
            </div>
          )}
        </SectionPanel>
      )}
    </div>
  )
}
