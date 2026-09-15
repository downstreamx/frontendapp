import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FleetStatusBadge } from '@/features/fleet/components/FleetStatusBadge'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { formatCurrency, formatDate } from '@/utils/helpers'
import { paths } from '@/lib/paths'
import { getContract } from '../contract-api'
import { PageContentLoader } from '@/components/ui/page-content-loader'

export function ContractShowPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => getContract(Number(id)),
    enabled: Boolean(id),
  })

  usePageChrome({
    pageTitle: contract?.subject ?? t('Contract'),
    breadcrumbs: [
      { label: t('Contracts'), url: paths.contract.index },
      { label: contract?.subject ?? `#${id}` },
    ],
  })

  if (isLoading) return <PageContentLoader className="min-h-[16rem]" />
  if (!contract) return <p className="text-sm text-destructive">{t('Contract not found.')}</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{contract.subject}</h1>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to={paths.contract.edit(contract.id)}>{t('Edit')}</Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link to={paths.contract.index}>{t('Back')}</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t('Details')}
            {contract.status ? <FleetStatusBadge status={contract.status} /> : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="font-medium">{t('Contract number')}:</span> {contract.contract_number ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('User')}:</span> {contract.user?.name ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('Type')}:</span> {contract.contract_type?.name ?? '—'}
          </p>
          <p>
            <span className="font-medium">{t('Value')}:</span>{' '}
            {contract.value != null ? formatCurrency(Number(contract.value)) : '—'}
          </p>
          <p>
            <span className="font-medium">{t('Start')}:</span>{' '}
            {contract.start_date ? formatDate(contract.start_date) : '—'}
          </p>
          <p>
            <span className="font-medium">{t('End')}:</span>{' '}
            {contract.end_date ? formatDate(contract.end_date) : '—'}
          </p>
          {contract.description ? (
            <p className="sm:col-span-2 whitespace-pre-wrap">{contract.description}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
