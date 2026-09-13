import { Button } from '@/components/ui/button'
import { Grid3X3, List } from 'lucide-react'

type ListGridToggleProps = {
  value: 'list' | 'grid'
  onChange: (view: 'list' | 'grid') => void
}

/** SPA-controlled list/grid view toggle (legacy toolbar control). */
export function ListGridToggle({ value, onChange }: ListGridToggleProps) {
  return (
    <div className="flex flex-row items-center rounded-md border">
      <Button
        variant={value === 'list' ? 'default' : 'ghost'}
        size="sm"
        type="button"
        onClick={() => onChange('list')}
        className="rounded-r-none"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={value === 'grid' ? 'default' : 'ghost'}
        size="sm"
        type="button"
        onClick={() => onChange('grid')}
        className="rounded-l-none"
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
    </div>
  )
}
