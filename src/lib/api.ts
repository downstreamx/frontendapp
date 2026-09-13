import axios from 'axios'

const TOKEN_KEY = 'downstreamx_token'
const REMEMBER_KEY = 'downstreamx_remember'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Let the browser set multipart boundary; a bare multipart/form-data header breaks uploads.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthToken()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string, remember = true): void {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(REMEMBER_KEY, '1')
    sessionStorage.removeItem(TOKEN_KEY)
  } else {
    sessionStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(REMEMBER_KEY, '0')
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REMEMBER_KEY)
}

export type ApiSuccess<T> = {
  success: true
  data: T
  message?: string
}

/** PHP does not parse multipart bodies on PUT; use POST with Laravel method spoofing. */
export async function submitFormDataUpdate<T>(url: string, formData: FormData): Promise<T> {
  if (!formData.has('_method')) {
    formData.append('_method', 'PUT')
  }
  const { data } = await api.post<ApiSuccess<T>>(url, formData)
  return data.data
}
