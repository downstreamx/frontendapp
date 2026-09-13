import { useTranslation } from 'react-i18next'
import { useDeleteHandler } from '@/hooks/useDeleteHandler'

type Options = {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

export function useProjectDelete({ onSuccess, onError }: Options = {}) {
  const { t } = useTranslation()

  return useDeleteHandler({
    routeName: 'taskly.projects.destroy',
    defaultMessage: t('Are you sure you want to delete this project item?'),
    onSuccess,
    onError,
  })
}

export function projectDeleteMessage(t: (key: string, opts?: Record<string, string>) => string, name: string) {
  return t('Are you sure you want to delete "{{name}}"? This will remove all tasks, bugs, milestones, and files.', {
    name,
  })
}
