import { Download, Image as ImageIcon } from 'lucide-react'
import { getImagePath } from '@/utils/helpers'

type Props = {
  path?: string | null
  alt?: string
}

export function ProductItemImage({ path, alt = 'Product' }: Props) {
  if (!path) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted">
        <ImageIcon className="h-6 w-6 text-muted-foreground" />
      </div>
    )
  }

  const imageUrl = getImagePath(path)
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(path)

  if (!isImage) {
    return (
      <button
        type="button"
        className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-md border bg-muted transition-colors hover:bg-muted/80"
        onClick={() => {
          const link = document.createElement('a')
          link.href = imageUrl
          link.download = path.split('/').pop() || 'file'
          link.click()
        }}
      >
        <Download className="h-6 w-6 text-muted-foreground" />
      </button>
    )
  }

  return (
    <button
      type="button"
      className="relative h-12 w-12 overflow-hidden rounded-md border"
      onClick={() => window.open(imageUrl, '_blank', 'noopener,noreferrer')}
    >
      <img
        src={imageUrl}
        alt={alt}
        className="h-12 w-12 object-cover transition-transform hover:scale-110"
        onError={(e) => {
          const target = e.currentTarget
          target.style.display = 'none'
        }}
      />
    </button>
  )
}
