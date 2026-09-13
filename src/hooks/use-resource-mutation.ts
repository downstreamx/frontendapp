import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useResourceMutation(listKey: string, endpoint: string) {
  const queryClient = useQueryClient()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [listKey] })

  const create = useMutation({
    mutationFn: async (body: unknown) => {
      const { data } = await api.post(endpoint, body)
      return data
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, body }: { id: number | string; body: unknown }) => {
      const { data } = await api.put(`${endpoint}/${id}`, body)
      return data
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: number | string) => {
      const { data } = await api.delete(`${endpoint}/${id}`)
      return data
    },
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
