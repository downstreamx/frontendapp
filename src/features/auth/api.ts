import { api, setAuthToken, clearAuthToken, type ApiSuccess } from '@/lib/api'

export type PersonNameFields = {
  first_name: string
  middle_name?: string | null
  last_name: string
}

export type MePayload = {
  user: {
    id: number
    first_name: string
    middle_name?: string | null
    last_name: string
    name: string
    email: string
    type: string
    slug?: string | null
    mobile_no?: string | null
    avatar?: string | null
    lang?: string
    permissions?: string[]
  }
  roles: string[]
  permissions: string[]
  activated_modules?: string[]
  company?: { id: number; name: string; slug: string }
  company_settings?: Record<string, string>
  admin_settings?: Record<string, string>
  image_url_prefix?: string
  is_demo?: boolean
  impersonating?: boolean
}

export async function fetchPlatformBrand() {
  const { data } = await api.get<
    ApiSuccess<{
      admin_settings: Record<string, string>
      image_url_prefix: string
      is_demo: boolean
    }>
  >('/public/platform-brand')
  return data.data
}

export async function login(email: string, password: string, remember = true) {
  const { data } = await api.post<ApiSuccess<{ token: string; me: MePayload }>>('/auth/login', {
    email,
    password,
    device_name: 'spa',
  })
  setAuthToken(data.data.token, remember)
  return data.data
}

export async function logout() {
  await api.post('/auth/logout')
  clearAuthToken()
}

export async function fetchMe() {
  const { data } = await api.get<ApiSuccess<MePayload>>('/auth/me')
  return data.data
}

export async function register(payload: PersonNameFields & {
  email: string
  password: string
  password_confirmation: string
}) {
  const { data } = await api.post<ApiSuccess<{ token: string; me: MePayload }>>('/auth/register', {
    ...payload,
    device_name: 'spa',
  })
  setAuthToken(data.data.token)
  return data.data
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<ApiSuccess<unknown>>('/auth/forgot-password', { email })
  return data
}

export async function resetPassword(payload: {
  email: string
  password: string
  password_confirmation: string
  token: string
}) {
  const { data } = await api.post<ApiSuccess<unknown>>('/auth/reset-password', payload)
  return data
}

export type UpdateMePayload = PersonNameFields & {
  email?: string
  mobile_no?: string | null
  avatar?: string | null
  slug?: string | null
  lang?: string
}

export async function updateMe(payload: UpdateMePayload) {
  const { data } = await api.patch<ApiSuccess<MePayload>>('/auth/me', payload)
  return data.data
}

export async function updatePassword(payload: {
  current_password: string
  password: string
  password_confirmation: string
}) {
  const { data } = await api.put<ApiSuccess<unknown>>('/auth/password', payload)
  return data
}
