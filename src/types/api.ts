export type OrgRole = 'ADMIN' | 'SALES' | 'INVENTORY'
export type PlatformRole = 'SUPER_ADMIN' | 'SUPPORT'
export type OrgStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING'
export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'CREDIT'
export type ImportStatus = 'PENDING' | 'COMMITTED' | 'REJECTED'

export interface AuthResponse {
  token: string
  userId: string
  email: string
  name: string
  orgId?: string | null
  orgName?: string | null
  role?: OrgRole | null
  orgStatus?: OrgStatus | null
  platformRole?: PlatformRole | null
  currency?: string | null
}

export interface Product {
  id: string
  sku?: string
  name: string
  barcode: string
  unit?: string
  sellingPrice?: number
  openingQty?: number
  availableQty?: number
  reorderLevel?: number
  lowStock: boolean
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface ProductPage {
  items: Product[]
  total: number
  page: number
  size: number
}

export interface ProductInput {
  sku?: string
  name: string
  barcode: string
  unit?: string
  sellingPrice?: number
  reorderLevel?: number
  openingQty?: number
  notes?: string
}

export interface SaleLine {
  productId: string
  barcode: string
  name: string
  qty: number
  unitPrice: number
  amount: number
}

export interface Sale {
  id: string
  saleNumber: string
  soldAt: string
  cashierName: string
  paymentMode: PaymentMode
  status: string
  totalQty: number
  totalAmount: number
  lines: SaleLine[]
}

export interface RowError {
  row: number
  message: string
}

export interface ImportPreview {
  importId: string
  filename: string
  newCount: number
  updateCount: number
  skipCount: number
  errors: RowError[]
}

export interface ImportHistory {
  id: string
  filename: string
  status: ImportStatus
  importedAt: string
  newCount: number
  updateCount: number
  skipCount: number
}

export interface ImportHistoryPage {
  items: ImportHistory[]
  total: number
  page: number
  size: number
}

export interface DailyRow {
  productId: string
  sku?: string
  name: string
  barcode: string
  openingQty: number
  placedQty: number
  soldQty: number
  endQty: number
  reorderLevel?: number
  lowStock: boolean
}

export interface DailyReport {
  date: string
  totalSalesAmount: number
  totalUnitsSold: number
  paymentBreakdown: Record<string, number>
  rows: DailyRow[]
}

export interface OrgUser {
  userId: string
  email: string
  name: string
  role: OrgRole
  status: 'ACTIVE' | 'INVITED'
}

export interface Settings {
  orgName: string
  currency: string
}

export interface OnboardOrgInput {
  orgName: string
  currency?: string
  adminEmail: string
  adminName: string
  adminPassword: string
}

export interface OnboardOrgResult {
  orgId: string
  orgName: string
  currency: string
  orgStatus: OrgStatus
  adminId: string
  adminEmail: string
  adminName: string
}

export interface PlatformOrgSummary {
  orgId: string
  orgName: string
  status: OrgStatus
  currency: string
  createdAt: string
  adminEmail?: string
  userCount: number
}

export interface UpdateAdminInput {
  email?: string
  name?: string
  password?: string
}

export interface PlatformUser {
  userId: string
  email: string
  name: string
  platformRole: PlatformRole
}

export interface CreatePlatformUserInput {
  email: string
  name: string
  password: string
  platformRole: PlatformRole
}

export interface UpdatePlatformUserInput {
  email?: string
  name?: string
  password?: string
  platformRole?: PlatformRole
}

export interface ApiError {
  error: string
  message: string
  fields?: Record<string, string>
}
