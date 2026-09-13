import { cn } from '@/lib/utils'

type Props = {
  html?: string | null
  className?: string
}

/** Render stored HTML (e.g. from TipTap) for HRM comms descriptions. */
export function HrmHtmlContent({ html, className }: Props) {
  if (!html?.trim()) return null

  return (
    <div
      className={cn(
        'prose prose-sm max-w-none rounded-md bg-muted/40 p-4',
        '[&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:my-1',
        '[&_a]:text-primary [&_a]:underline',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
