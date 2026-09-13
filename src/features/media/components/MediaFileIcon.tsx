import { Image as ImageIcon } from 'lucide-react'

type MediaFileIconProps = {
  mimeType: string
  className?: string
}

function FileBadge({ label, colorClass, className }: { label: string; colorClass: string; className: string }) {
  return (
    <div className={`${className} ${colorClass} rounded text-white text-xs flex items-center justify-center font-bold`}>
      {label}
    </div>
  )
}

export function MediaFileIcon({ mimeType, className = 'h-8 w-8' }: MediaFileIconProps) {
  if (mimeType.startsWith('image/')) {
    return <ImageIcon className={className} />
  }
  if (mimeType.includes('pdf')) {
    return <FileBadge label="PDF" colorClass="bg-red-500" className={className} />
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return <FileBadge label="DOC" colorClass="bg-blue-500" className={className} />
  }
  if (mimeType.includes('csv') || mimeType.includes('spreadsheet')) {
    return <FileBadge label="CSV" colorClass="bg-green-500" className={className} />
  }
  if (mimeType.startsWith('video/')) {
    return <FileBadge label="VID" colorClass="bg-purple-500" className={className} />
  }
  if (mimeType.startsWith('audio/')) {
    return <FileBadge label="AUD" colorClass="bg-orange-500" className={className} />
  }
  return <FileBadge label="FILE" colorClass="bg-muted-foreground" className={className} />
}
