import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MultiSelectEnhanced } from '@/components/ui/multi-select-enhanced'
import { usePageChrome } from '@/contexts/page-chrome-context'
import { getApiErrorMessage } from '@/lib/errors'
import { paths } from '@/lib/paths'
import { candidateFullName } from '../recruitment-candidates-api'
import {
  createInterview,
  fetchCandidateInterviewRounds,
  fetchCandidateJobRemote,
  fetchInterviewsIndexMeta,
  getInterview,
  updateInterview,
} from '../recruitment-interviews-api'

export function InterviewFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [candidateId, setCandidateId] = useState('')
  const [roundId, setRoundId] = useState('')
  const [typeId, setTypeId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('09:00')
  const [duration, setDuration] = useState('60')
  const [location, setLocation] = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [status, setStatus] = useState('Scheduled')
  const [interviewerIds, setInterviewerIds] = useState<string[]>([])
  const [isRemote, setIsRemote] = useState(false)

  const { data: meta } = useQuery({
    queryKey: ['recruitment', 'interviews', 'index-meta'],
    queryFn: fetchInterviewsIndexMeta,
  })

  const interviewQuery = useQuery({
    queryKey: ['recruitment', 'interviews', id],
    queryFn: () => getInterview(Number(id)),
    enabled: isEdit,
  })

  const { data: rounds = [] } = useQuery({
    queryKey: ['recruitment', 'candidates', candidateId, 'interview-rounds'],
    queryFn: () => fetchCandidateInterviewRounds(Number(candidateId)),
    enabled: Boolean(candidateId),
  })

  useQuery({
    queryKey: ['recruitment', 'candidates', candidateId, 'job-location'],
    queryFn: async () => {
      const res = await fetchCandidateJobRemote(Number(candidateId))
      setIsRemote(res.remote_work)
      if (res.remote_work) setLocation('Online')
      return res
    },
    enabled: Boolean(candidateId),
  })

  useEffect(() => {
    const row = interviewQuery.data
    if (!row) return
    setCandidateId(String(row.candidate_id ?? row.candidate?.id ?? ''))
    setRoundId(String(row.round_id ?? row.interview_round?.id ?? row.interviewRound?.id ?? ''))
    setTypeId(String(row.interview_type_id ?? row.interview_type?.id ?? row.interviewType?.id ?? ''))
    setScheduledDate(row.scheduled_date?.slice(0, 10) ?? '')
    setScheduledTime(row.scheduled_time ? String(row.scheduled_time).slice(0, 5) : '09:00')
    setDuration(String(row.duration ?? 60))
    setLocation(row.location ?? '')
    setMeetingLink(row.meeting_link ?? '')
    setStatus(row.status ?? 'Scheduled')
    setInterviewerIds((row.interviewer_ids ?? []).map(String))
  }, [interviewQuery.data])

  const employeeOptions = useMemo(
    () =>
      (meta?.employees ?? []).map((e) => ({
        value: String(e.id),
        label: e.name,
      })),
    [meta?.employees],
  )

  usePageChrome({
    pageTitle: isEdit ? t('Edit interview') : t('Schedule interview'),
    breadcrumbs: [
      { label: t('Recruitment') },
      { label: t('Interviews'), url: paths.recruitment.interviews },
      { label: isEdit ? t('Edit') : t('Create') },
    ],
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        candidate_id: Number(candidateId),
        round_id: Number(roundId),
        interview_type_id: Number(typeId),
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        duration: Number(duration),
        location: location || undefined,
        meeting_link: meetingLink || undefined,
        interviewer_ids: interviewerIds.map(Number),
        status,
      }
      return isEdit ? updateInterview(Number(id), payload) : createInterview(payload)
    },
    onSuccess: (row) => {
      toast.success(t(isEdit ? 'Interview updated' : 'Interview scheduled'))
      navigate(paths.recruitment.interviewShow(row.id))
    },
    onError: (err) => toast.error(getApiErrorMessage(err, t('Failed to save interview'))),
  })

  if (isEdit && interviewQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t('Loading…')}</p>
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? t('Edit interview') : t('Schedule interview')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!candidateId || !roundId || !typeId) return
            saveMutation.mutate()
          }}
        >
          <div className="space-y-1">
            <Label>{t('Candidate')}</Label>
            <Select value={candidateId} onValueChange={(v) => { setCandidateId(v); setRoundId('') }}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select candidate')} />
              </SelectTrigger>
              <SelectContent>
                {(meta?.candidates ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {candidateFullName(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{t('Interview round')}</Label>
            <Select value={roundId} onValueChange={setRoundId} disabled={!candidateId}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select round')} />
              </SelectTrigger>
              <SelectContent>
                {rounds.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{t('Interview type')}</Label>
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger>
                <SelectValue placeholder={t('Select type')} />
              </SelectTrigger>
              <SelectContent>
                {(meta?.interview_types ?? []).map((type) => (
                  <SelectItem key={type.id} value={String(type.id)}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('Date')}</Label>
              <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>{t('Time')}</Label>
              <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1">
            <Label>{t('Duration (minutes)')}</Label>
            <Input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>{t('Location')}</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isRemote}
              placeholder={isRemote ? t('Online') : t('Office or address')}
            />
          </div>
          {(isRemote || meetingLink) && (
            <div className="space-y-1">
              <Label>{t('Meeting link')}</Label>
              <Input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} />
            </div>
          )}
          <div className="space-y-1">
            <Label>{t('Interviewers')}</Label>
            <MultiSelectEnhanced
              options={employeeOptions}
              value={interviewerIds}
              onChange={setInterviewerIds}
              placeholder={t('Select interviewers')}
            />
          </div>
          <div className="space-y-1">
            <Label>{t('Status')}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(meta?.statuses ?? []).map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
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
              <Link to={paths.recruitment.interviews}>{t('Cancel')}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
