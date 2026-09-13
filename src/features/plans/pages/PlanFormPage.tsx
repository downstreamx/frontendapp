import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { paths } from '@/lib/paths'
import { PlanForm } from '../components/PlanForm'

export function PlanFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const planId = id ? Number(id) : undefined
  const { t } = useTranslation()

  usePageChrome({
    pageTitle: isEdit ? t('Edit Plan') : t('Create Plan'),
    breadcrumbs: [
      { label: t('Subscription Setting'), url: paths.plans },
      { label: isEdit ? t('Edit Plan') : t('Create Plan') },
    ],
  })

  return (
    <Card>
      <CardContent className="pt-6">
        <PlanForm planId={planId} isEdit={isEdit} />
      </CardContent>
    </Card>
  )
}
