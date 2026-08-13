import axios, { AxiosError } from 'axios'
import type { ApiError } from '@/types/api'

const TOKEN_KEY = 'shop_inventory_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      tokenStore.clear()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

export function messageFromError(error: unknown): string {
  const axiosError = error as AxiosError<ApiError>
  if (axiosError.response?.data?.message) return axiosError.response.data.message
  if (axiosError.code === 'ECONNABORTED' || !axiosError.response) {
    return 'Cannot reach the server. Is the backend running?'
  }
  return 'Something went wrong'
}
