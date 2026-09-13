import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { paths } from '@/lib/paths'
import { fetchCareersPortal } from '../careers-public-api'

export function CareersPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const slug = searchParams.get('slug') ?? ''

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['careers', slug],
    queryFn: () => fetchCareersPortal(slug),
    enabled: slug.length > 0,
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold">
          {data?.brand?.title_text || t('Careers')}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {data?.company?.our_mission || t('Open positions at our company.')}
        </p>
      </div>

      {!slug && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('Enter your company careers slug to view open roles.')}
            </p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                const value = (e.currentTarget.elements.namedItem('slug') as HTMLInputElement).value
                setSearchParams({ slug: value.trim() })
              }}
            >
              <Input name="slug" placeholder={t('Company slug')} defaultValue={slug} />
              <Button type="submit">{t('View jobs')}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {slug && isLoading && (
        <p className="text-sm text-muted-foreground">{t('Loading openings…')}</p>
      )}

      {slug && error && (
        <p className="text-sm text-destructive">
          {t('Careers portal not found. Check the slug and try again.')}
        </p>
      )}

      {data && (
        <>
          <div className="space-y-3">
            {data.jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('No open positions right now.')}</p>
            ) : (
              data.jobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      <Link
                        to={`/careers/jobs/${job.id}?slug=${encodeURIComponent(slug)}`}
                        className="hover:underline"
                      >
                        {job.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    {[job.location, job.job_type].filter(Boolean).join(' · ')}
                    {job.application_deadline ? (
                      <p>
                        {t('Apply by')}: {job.application_deadline}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              to={`/careers/track?slug=${encodeURIComponent(slug)}`}
              className="text-primary hover:underline"
            >
              {t('Track application')}
            </Link>
            <Link to={paths.login} className="text-primary hover:underline">
              {t('Staff sign in')}
            </Link>
            <button type="button" className="text-primary hover:underline" onClick={() => refetch()}>
              {t('Refresh')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
