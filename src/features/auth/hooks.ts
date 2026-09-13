import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMe, forgotPassword, login, logout, register, resetPassword, updateMe } from './api'
import { getAuthToken } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

export function useMeQuery() {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: fetchMe,
    enabled: !!getAuthToken(),
    retry: false,
  })
}

export function useLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      email,
      password,
      remember = true,
    }: {
      email: string
      password: string
      remember?: boolean
    }) => login(email, password, remember),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.me(), data.me)
    },
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export function useRegisterMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.auth.me(), data.me)
    },
  })
}

export function useForgotPasswordMutation() {
  return useMutation({ mutationFn: forgotPassword })
}

export function useResetPasswordMutation() {
  return useMutation({ mutationFn: resetPassword })
}

export function useUpdateMeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateMe,
    onSuccess: (me) => {
      queryClient.setQueryData(queryKeys.auth.me(), me)
    },
  })
}
