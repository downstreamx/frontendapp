import { describe, expect, it, vi } from 'vitest'
import { normalizeSelectedMediaPath, resolveMediaUrl } from './media-url'

const apiPrefix = 'https://api.downstreamx.local/storage/'

describe('resolveMediaUrl', () => {
  it('builds avatar URL from basename and API storage prefix', () => {
    expect(resolveMediaUrl('kW9dYoh9zJ0H7AqNnCTiJ99pknql73fjYXzHVYZa.jpg', apiPrefix)).toBe(
      'https://api.downstreamx.local/storage/media/kW9dYoh9zJ0H7AqNnCTiJ99pknql73fjYXzHVYZa.jpg',
    )
  })

  it('builds avatar URL from media/ relative path', () => {
    expect(resolveMediaUrl('media/kW9dYoh9zJ0H7AqNnCTiJ99pknql73fjYXzHVYZa.jpg', apiPrefix)).toBe(
      'https://api.downstreamx.local/storage/media/kW9dYoh9zJ0H7AqNnCTiJ99pknql73fjYXzHVYZa.jpg',
    )
  })

  it('passes through full storage paths with API prefix', () => {
    expect(resolveMediaUrl('/storage/media/avatar.jpg', apiPrefix)).toBe(
      'https://api.downstreamx.local/storage/media/avatar.jpg',
    )
  })

  it('rewrites SPA-origin storage URLs using image_url_prefix from the API', () => {
    expect(
      resolveMediaUrl(
        'http://localhost:5174/storage/media/avatar.jpg',
        'http://api.downstreamx.local/storage/',
      ),
    ).toBe('http://api.downstreamx.local/storage/media/avatar.jpg')
  })

  it('rewrites SPA-origin storage URLs using VITE_API_BASE_URL', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.downstreamx.local/api/v1')

    expect(resolveMediaUrl('http://localhost:5174/storage/media/avatar.jpg')).toBe(
      'https://api.downstreamx.local/storage/media/avatar.jpg',
    )

    vi.unstubAllEnvs()
  })
})

describe('normalizeSelectedMediaPath', () => {
  it('stores basename from API media URL', () => {
    expect(normalizeSelectedMediaPath('/storage/media/avatar.jpg')).toBe('avatar.jpg')
  })
})
