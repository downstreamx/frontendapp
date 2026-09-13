export type TableRowActionVariant = 'view' | 'edit' | 'print' | 'delete'

/** Subtle tinted icon buttons for data-table row actions. */
export function tableRowActionButtonClass(variant: TableRowActionVariant): string {
  const base = 'h-8 w-8 p-0 shadow-none'
  switch (variant) {
    case 'view':
      return `${base} border border-green-600/25 bg-green-600/8 text-green-700 hover:bg-green-600/15 hover:text-green-800 dark:text-green-300`
    case 'edit':
      return `${base} border border-blue-600/25 bg-blue-600/8 text-blue-700 hover:bg-blue-600/15 hover:text-blue-800 dark:text-blue-300`
    case 'print':
      return `${base} border border-border/70 bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground`
    case 'delete':
      return `${base} border border-destructive/25 bg-destructive/5 text-destructive hover:bg-destructive/10`
  }
}
