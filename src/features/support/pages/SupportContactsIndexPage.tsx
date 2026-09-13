import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DataTable, type Column } from '@/components/ui/data-table'
import { NoRecordsFound } from '@/components/no-records-found'
import { ModuleListCard } from '@/features/shared/components/ModuleListCard'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createSupportContact, listSupportContacts } from '../support-api'

type SupportContactRow = {
  id: number
  name?: string
  email: string
  subject: string
}

export function SupportContactsIndexPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const listQuery = useQuery({
    queryKey: ['support-ticket', 'contacts'],
    queryFn: listSupportContacts,
  })

  const rows = (listQuery.data ?? []) as SupportContactRow[]

  const createMutation = useMutation({
    mutationFn: createSupportContact,
    onSuccess: () => {
      toast.success(t('Contact message saved'))
      queryClient.invalidateQueries({ queryKey: ['support-ticket', 'contacts'] })
      setOpen(false)
    },
    onError: () => toast.error(t('Failed to save contact')),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      first_name: firstName,
      last_name: lastName,
      email,
      subject,
      message,
    })
  }

  const columns: Column<SupportContactRow>[] = [
    {
      key: 'name',
      header: t('Contact'),
      render: (_, row) => row.name ?? row.email,
    },
    {
      key: 'email',
      header: t('Email'),
      render: (value) => String(value ?? '—'),
    },
    {
      key: 'subject',
      header: t('Subject'),
      render: (value) => String(value ?? '—'),
    },
  ]

  return (
    <ModuleListCard
      title={t('Contact submissions')}
      isLoading={listQuery.isLoading}
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">{t('Log contact')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('Log contact message')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>{t('First name')}</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>{t('Last name')}</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label>{t('Email')}</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>{t('Subject')}</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>{t('Message')}</Label>
                <Input value={message} onChange={(e) => setMessage(e.target.value)} required />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {t('Save')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      {rows.length === 0 && !listQuery.isLoading ? (
        <NoRecordsFound
          icon={Mail}
          title={t('No contact submissions')}
          description={t('Logged contact messages will appear here.')}
          className="h-auto py-8"
        />
      ) : (
        <DataTable embedded data={rows} columns={columns} />
      )}
    </ModuleListCard>
  )
}
