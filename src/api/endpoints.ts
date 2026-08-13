import { api } from './client'
import type {
  AuthResponse,
  CreatePlatformUserInput,
  DailyReport,
  ImportHistoryPage,
  ImportPreview,
  OnboardOrgInput,
  OnboardOrgResult,
  OrgUser,
  PaymentMode,
  PlatformOrgSummary,
  PlatformUser,
  Product,
  ProductInput,
  ProductPage,
  Sale,
  Settings,
  UpdateAdminInput,
  UpdatePlatformUserInput,
} from '@/types/api'

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
  me: () => api.get<AuthResponse>('/auth/me').then((r) => r.data),
}

export const productApi = {
  list: (params?: { q?: string; low?: boolean; page?: number; size?: number }) =>
    api.get<ProductPage>('/products', { params }).then((r) => r.data),
  get: (id: string) => api.get<Product>(`/products/${id}`).then((r) => r.data),
  getByBarcode: (barcode: string) =>
    api.get<Product>(`/products/by-barcode/${encodeURIComponent(barcode)}`).then((r) => r.data),
  create: (input: ProductInput) => api.post<Product>('/products', input).then((r) => r.data),
  update: (id: string, input: ProductInput) =>
    api.put<Product>(`/products/${id}`, input).then((r) => r.data),
  remove: (id: string) => api.delete(`/products/${id}`),
  adjustStock: (id: string, newQuantity: number, reason?: string) =>
    api.post<Product>(`/products/${id}/stock/adjust`, { newQuantity, reason }).then((r) => r.data),
}

export const saleApi = {
  list: () => api.get<Sale[]>('/sales').then((r) => r.data),
  create: (lines: { barcode: string; qty: number }[], paymentMode: PaymentMode, notes?: string) =>
    api.post<Sale>('/sales', { lines, paymentMode, notes }).then((r) => r.data),
}

export const importApi = {
  preview: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post<ImportPreview>('/imports/preview', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
  commit: (importId: string) => api.post(`/imports/${importId}/commit`).then((r) => r.data),
  history: (params?: { page?: number; size?: number }) =>
    api.get<ImportHistoryPage>('/imports', { params }).then((r) => r.data),
}

export const reportApi = {
  daily: (date: string) => api.get<DailyReport>('/reports/daily', { params: { date } }).then((r) => r.data),
}

export const orgApi = {
  settings: () => api.get<Settings>('/organization/settings').then((r) => r.data),
  updateSettings: (orgName?: string, currency?: string) =>
    api.put<Settings>('/organization/settings', { orgName, currency }).then((r) => r.data),
  users: () => api.get<OrgUser[]>('/organization/users').then((r) => r.data),
  addUser: (input: { email: string; name: string; password: string; role: string }) =>
    api.post<OrgUser>('/organization/users', input).then((r) => r.data),
  changeRole: (userId: string, role: string) =>
    api.patch<OrgUser>(`/organization/users/${userId}/role`, { role }).then((r) => r.data),
  removeUser: (userId: string) => api.delete(`/organization/users/${userId}`),
}

export const platformApi = {
  onboard: (input: OnboardOrgInput) =>
    api.post<OnboardOrgResult>('/platform/organizations', input).then((r) => r.data),
  listOrgs: () => api.get<PlatformOrgSummary[]>('/platform/organizations').then((r) => r.data),
  setOrgStatus: (orgId: string, status: string) =>
    api.patch(`/platform/organizations/${orgId}/status`, { status }),
  updateAdmin: (orgId: string, input: UpdateAdminInput) =>
    api.patch(`/platform/organizations/${orgId}/admin`, input),
  listTeam: () => api.get<PlatformUser[]>('/platform/team').then((r) => r.data),
  createTeamMember: (input: CreatePlatformUserInput) =>
    api.post<PlatformUser>('/platform/team', input).then((r) => r.data),
  updateTeamMember: (userId: string, input: UpdatePlatformUserInput) =>
    api.patch(`/platform/team/${userId}`, input),
}
