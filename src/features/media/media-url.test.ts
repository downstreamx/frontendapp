import { describe, expect, it, vi } from 'vitest'
import { normalizeSelectedMediaPath, resolveMediaUrl } from './media-url'

const apiPrefix = 'https://api.downstreamx.local/storage/media/'
const s3Prefix = 'https://downstreamx-staging.s3.eu-north-1.amazonaws.com/media/'

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

  it('builds S3 media URL from basename and S3 image_url_prefix', () => {
    expect(resolveMediaUrl('o6Q0SKOMPgcsyEHgnrmzzPwue87qPavXvvwR0FN6.png', s3Prefix)).toBe(
      'https://downstreamx-staging.s3.eu-north-1.amazonaws.com/media/o6Q0SKOMPgcsyEHgnrmzzPwue87qPavXvvwR0FN6.png',
    )
  })

  it('rewrites legacy API /storage/ URLs onto the S3 prefix', () => {
    expect(
      resolveMediaUrl(
        'https://staging-api.downstreamx.com/storage/media/o6Q0SKOMPgcsyEHgnrmzzPwue87qPavXvvwR0FN6.png',
        s3Prefix,
      ),
    ).toBe(
      'https://downstreamx-staging.s3.eu-north-1.amazonaws.com/media/o6Q0SKOMPgcsyEHgnrmzzPwue87qPavXvvwR0FN6.png',
    )
  })

  it('rewrites SPA-origin storage URLs using image_url_prefix from the API', () => {
    expect(
      resolveMediaUrl(
        'http://localhost:5174/storage/media/avatar.jpg',
        'http://api.downstreamx.local/storage/media/',
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

  it('resolves current packages/downstreamx media paths against the API origin', () => {
    expect(
      resolveMediaUrl('packages/downstreamx/Account/src/Resources/assets/logo.png', apiPrefix),
    ).toBe(
      'https://api.downstreamx.local/packages/downstreamx/Account/src/Resources/assets/logo.png',
    )
  })

  it('still resolves stored packages/workdo media paths against the API origin', () => {
    expect(
      resolveMediaUrl('packages/workdo/Account/src/Resources/assets/logo.png', apiPrefix),
    ).toBe('https://api.downstreamx.local/packages/workdo/Account/src/Resources/assets/logo.png')
  })

  it('accepts legacy /storage/ prefix without /media/', () => {
    expect(
      resolveMediaUrl('avatar.jpg', 'https://api.downstreamx.local/storage/'),
    ).toBe('https://api.downstreamx.local/storage/media/avatar.jpg')
  })
})

describe('normalizeSelectedMediaPath', () => {
  it('stores basename from API media URL', () => {
    expect(normalizeSelectedMediaPath('/storage/media/avatar.jpg')).toBe('avatar.jpg')
  })

  it('stores basename from S3 media URL', () => {
    expect(
      normalizeSelectedMediaPath(
        'https://downstreamx-staging.s3.eu-north-1.amazonaws.com/media/avatar.jpg',
      ),
    ).toBe('avatar.jpg')
  })
})
