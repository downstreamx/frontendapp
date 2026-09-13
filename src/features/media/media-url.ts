/**
 * Media path helpers — align SPA storage URLs with API `image_url_prefix` and legacy basename storage.
 */

export function normalizeSelectedMediaPath(url: string): string {
  if (!url || typeof url !== 'string') return ''

  let path = url
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      path = new URL(path).pathname
    } catch {
      return url
    }
  }

  const storageMatch = path.match(/\/storage\/media\/(.+)$/)
  if (storageMatch) return storageMatch[1]

  const mediaMatch = path.match(/\/?media\/(.+)$/)
  if (mediaMatch) return mediaMatch[1]

  if (path.startsWith('/')) {
    return path.split('/').filter(Boolean).pop() ?? path
  }

  return path
}

function isPackageMediaPath(mediaPath: string): boolean {
  const relative = mediaPath.replace(/^\//, '')

  return relative.startsWith('packages/downstreamx/') || relative.startsWith('packages/workdo/')
}

function buildStorageMediaBase(prefix: string, isPackagePath = false): string {
  const normalized = prefix.endsWith('/') ? prefix : `${prefix}/`

  if (isPackagePath) {
    return normalized.replace(/\/?storage\/media\/?$/, '').replace(/\/?storage\/?$/, '')
  }

  if (normalized.includes('storage/media')) {
    return normalized.endsWith('/') ? normalized : `${normalized}/`
  }

  if (/\/storage\/?$/.test(normalized)) {
    return normalized.replace(/\/?storage\/?$/, '/storage/media/')
  }

  return `${normalized.replace(/\/?$/, '')}/storage/media/`
}

function collapseSlashes(url: string): string {
  return url.replace(/([^:]\/)\/+/g, '$1')
}

/** Derive API storage prefix from env when `/me` is unavailable (guest pages). */
export function getApiStoragePrefix(): string {
  const fromEnv = import.meta.env.VITE_STORAGE_URL
  if (typeof fromEnv === 'string' && fromEnv.startsWith('http')) {
    return fromEnv.endsWith('/') ? fromEnv : `${fromEnv}/`
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL
  if (typeof apiBase === 'string' && apiBase.startsWith('http')) {
    const origin = apiBase.replace(/\/api\/v\d+\/?$/, '')
    return `${origin}/storage/`
  }

  return '/storage/'
}

function resolveEffectiveStoragePrefix(imageUrlPrefix?: string): string {
  const trimmed = imageUrlPrefix?.trim()
  if (trimmed?.startsWith('http')) {
    return trimmed.endsWith('/') ? trimmed : `${trimmed}/`
  }

  return getApiStoragePrefix()
}

function rewriteStorageUrl(url: string, imageUrlPrefix?: string): string {
  try {
    const parsed = new URL(url)
    if (!parsed.pathname.includes('/storage/')) {
      return url
    }

    const targetPrefix = resolveEffectiveStoragePrefix(imageUrlPrefix)
    if (!targetPrefix.startsWith('http')) {
      return url
    }

    const targetBase = targetPrefix.replace(/\/?storage\/?$/, '')
    return collapseSlashes(`${targetBase}${parsed.pathname}`)
  } catch {
    return url
  }
}

export function resolveMediaUrl(path: string, imageUrlPrefix?: string): string {
  if (!path || typeof path !== 'string') return ''

  const prefix = resolveEffectiveStoragePrefix(imageUrlPrefix)

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path.includes('/storage/') ? rewriteStorageUrl(path, imageUrlPrefix) : path
  }
  const isPackagePath = isPackageMediaPath(path)

  if (path.includes('storage/media') || path.startsWith('/storage/')) {
    if (prefix.startsWith('http')) {
      const base = prefix.replace(/\/?storage\/?$/, '')
      const normalizedPath = path.startsWith('/') ? path : `/${path}`
      return collapseSlashes(`${base}${normalizedPath}`)
    }

    const apiPrefix = getApiStoragePrefix()
    if (apiPrefix.startsWith('http')) {
      const base = apiPrefix.replace(/\/?storage\/?$/, '')
      const normalizedPath = path.startsWith('/') ? path : `/${path}`
      return collapseSlashes(`${base}${normalizedPath}`)
    }

    const localPath = path.startsWith('/') ? path : `/${path}`
    return `${window.location.origin}${localPath}`
  }

  let relativePath = path.replace(/^\//, '')
  if (!isPackagePath && relativePath.startsWith('media/')) {
    relativePath = relativePath.slice('media/'.length)
  } else if (!isPackagePath && relativePath.includes('/')) {
    relativePath = relativePath.split('/').pop() ?? relativePath
  }

  const base = buildStorageMediaBase(prefix, isPackagePath)
  const joined = base.endsWith('/') ? `${base}${relativePath}` : `${base}/${relativePath}`

  if (prefix.startsWith('http')) {
    return collapseSlashes(joined)
  }

  const apiPrefix = getApiStoragePrefix()
  if (apiPrefix.startsWith('http')) {
    const apiBase = buildStorageMediaBase(apiPrefix, isPackagePath)
    const apiJoined = apiBase.endsWith('/') ? `${apiBase}${relativePath}` : `${apiBase}/${relativePath}`
    return collapseSlashes(apiJoined)
  }

  const originBase = base.startsWith('/') ? `${window.location.origin}${base}` : `${window.location.origin}/${base}`
  const localJoined = originBase.endsWith('/') ? `${originBase}${relativePath}` : `${originBase}/${relativePath}`
  return collapseSlashes(localJoined)
}

export function getMediaFileType(url: string): 'image' | 'video' | 'file' {
  const extension = url.split('?')[0]?.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) return 'image'
  if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(extension)) return 'video'
  return 'file'
}
