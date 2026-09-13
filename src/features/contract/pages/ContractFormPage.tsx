import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EntitySelect } from '@/components/forms/entity-select'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { createContract, getContract, updateContract } from '../contract-api'
import { useContractsIndexMeta } from '../hooks/use-contract-meta'

export function ContractFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [subject, setSubject] = useState('')
  const [userId, setUserId] = useState('')
  const [typeId, setTypeId] = useState('')
  const [value, setValue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('')

  const { meta, contractTypeOptions, userOptions } = useContractsIndexMeta()

  const contractQuery = useQuery({
    queryKey: ['contract', id],
    queryFn: () => getContract(Number(id)),
    enabled: isEdit,
  })

  useEffect(() => {
    const row = contractQuery.data
    if (!row) return
    setSubject(row.subject)
    setUserId(String(row.user_id ?? row.user?.id ?? ''))
    setTypeId(String(row.type_id ?? row.contract_type?.id ?? ''))
    setValue(row.value != null ? String(row.value) : '')
    setStartDate(row.start_date?.slice(0, 10) ?? '')
    setEndDate(row.end_date?.slice(0, 10) ?? '')
    setDescription(row.description ?? '')
    setStatus(row.status ?? '')
  }, [contractQuery.data])

  usePageChrome({
    pageTitle: isEdit ? t('Edit contract') : t('Create contract'),
    breadcrumbs: [
      { label: t('Contracts'), url: paths.contract.index },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        subject,
        user_id: Number(userId),
        type_id: Number(typeId),
        value: value ? Number(value) : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        description: description || undefined,
        status: status || undefined,
      }
      return isEdit ? updateContract(Number(id), payload) : createContract(payload)
    },
    onSuccess: (row) => {
      toast.success(isEdit ? t('Contract updated') : t('Contract created'))
      void queryClient.invalidateQueries({ queryKey: ['contract'] })
      navigate(paths.contract.show(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save contract'))),
  })

  if (isEdit && contractQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? t('Edit contract') : t('Create contract')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            saveMutation.mutate()
          }}
        >
          <div className="space-y-1">
            <Label>{t('Subject')}</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('User')}</Label>
              <EntitySelect value={userId} onValueChange={setUserId} options={userOptions} required />
            </div>
            <div className="space-y-1">
              <Label>{t('Contract type')}</Label>
              <EntitySelect value={typeId} onValueChange={setTypeId} options={contractTypeOptions} required />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('Value')}</Label>
            <Input type="number" min={0} step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t('Start date')}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t('End date')}</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('Description')}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="space-y-1">
            <Label>{t('Status')}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select status')} />
              </SelectTrigger>
              <SelectContent>
                {(meta?.statuses ?? []).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {t('Save')}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to={isEdit && id ? paths.contract.show(id) : paths.contract.index}>{t('Cancel')}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
