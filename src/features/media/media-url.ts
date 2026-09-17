/**
 * Media path helpers — align SPA storage URLs with API `image_url_prefix`.
 *
 * Contract: `image_url_prefix` ends with `.../media/` (local `/storage/media/` or S3 `.../media/`).
 * Stored logo/avatar values are usually basenames.
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
    // Package assets live on the API host, never on the S3 media prefix.
    const apiBase = import.meta.env.VITE_API_BASE_URL
    if (typeof apiBase === 'string' && apiBase.startsWith('http')) {
      return `${apiBase.replace(/\/api\/v\d+\/?$/, '')}/`
    }

    return normalized
      .replace(/\/?storage\/media\/?$/, '/')
      .replace(/\/media\/?$/, '/')
      .replace(/\/?storage\/?$/, '/')
  }

  // Already a media root (S3 AWS_URL/media/ or local APP_URL/storage/media/)
  if (/\/media\/?$/.test(normalized) || normalized.includes('storage/media')) {
    return normalized.endsWith('/') ? normalized : `${normalized}/`
  }

  // Legacy API prefix ending in /storage/
  if (/\/storage\/?$/.test(normalized)) {
    return normalized.replace(/\/?storage\/?$/, '/storage/media/')
  }

  // Bare origin / CDN root → media/
  return `${normalized.replace(/\/?$/, '')}/media/`
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
    return `${origin}/storage/media/`
  }

  return '/storage/media/'
}

function resolveEffectiveStoragePrefix(imageUrlPrefix?: string): string {
  const trimmed = imageUrlPrefix?.trim()
  if (trimmed?.startsWith('http')) {
    return trimmed.endsWith('/') ? trimmed : `${trimmed}/`
  }

  return getApiStoragePrefix()
}

function rewriteLegacyStorageUrl(url: string, imageUrlPrefix?: string): string {
  try {
    const parsed = new URL(url)
    if (!parsed.pathname.includes('/storage/') && !parsed.pathname.includes('/media/')) {
      return url
    }

    const targetPrefix = resolveEffectiveStoragePrefix(imageUrlPrefix)
    if (!targetPrefix.startsWith('http')) {
      return url
    }

    const basename = normalizeSelectedMediaPath(parsed.pathname)
    const base = buildStorageMediaBase(targetPrefix)

    return collapseSlashes(`${base}${basename}`)
  } catch {
    return url
  }
}

export function resolveMediaUrl(path: string, imageUrlPrefix?: string): string {
  if (!path || typeof path !== 'string') return ''

  const prefix = resolveEffectiveStoragePrefix(imageUrlPrefix)

  if (path.startsWith('http://') || path.startsWith('https://')) {
    // Already on S3 / CDN — leave alone unless it is a legacy API /storage/ URL
    if (path.includes('/storage/')) {
      return rewriteLegacyStorageUrl(path, imageUrlPrefix)
    }
    return path
  }

  const isPackagePath = isPackageMediaPath(path)

  if (path.includes('storage/media') || path.startsWith('/storage/')) {
    const basename = normalizeSelectedMediaPath(path)
    const base = buildStorageMediaBase(prefix)
    if (prefix.startsWith('http')) {
      return collapseSlashes(`${base}${basename}`)
    }

    const apiPrefix = getApiStoragePrefix()
    if (apiPrefix.startsWith('http')) {
      return collapseSlashes(`${buildStorageMediaBase(apiPrefix)}${basename}`)
    }

    return `${window.location.origin}/storage/media/${basename}`
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
