import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { HomeRedirect, ProtectedRoute, RequirePlatform, RequireRoles } from '@/auth/guards'
import { AppLayout } from '@/components/AppLayout'
import { LoginPage } from '@/features/login/LoginPage'
import { InvoicePage } from '@/features/invoice/InvoicePage'
import { POSPage } from '@/features/pos/POSPage'
import { ProductsPage } from '@/features/products/ProductsPage'
import { ImportsPage } from '@/features/imports/ImportsPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { PlatformStatsPage } from '@/features/platform/PlatformStatsPage'
import { PlatformOrgsPage } from '@/features/platform/PlatformOrgsPage'
import { OnboardOrgPage } from '@/features/platform/OnboardOrgPage'
import { PlatformTeamPage } from '@/features/platform/PlatformTeamPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/invoice/:saleId"
          element={
            <ProtectedRoute>
              <InvoicePage />
            </ProtectedRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<HomeRedirect />} />
          <Route
            path="/pos"
            element={
              <RequireRoles roles={['ADMIN', 'SALES']}>
                <POSPage />
              </RequireRoles>
            }
          />
          <Route path="/products" element={<ProductsPage />} />
          <Route
            path="/imports"
            element={
              <RequireRoles roles={['ADMIN', 'INVENTORY']}>
                <ImportsPage />
              </RequireRoles>
            }
          />
          <Route
            path="/reports"
            element={
              <RequireRoles roles={['ADMIN', 'INVENTORY']}>
                <ReportsPage />
              </RequireRoles>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireRoles roles={['ADMIN']}>
                <SettingsPage />
              </RequireRoles>
            }
          />
          <Route
            path="/platform/statistics"
            element={
              <RequirePlatform roles={['SUPER_ADMIN', 'SUPPORT']}>
                <PlatformStatsPage />
              </RequirePlatform>
            }
          />
          <Route
            path="/platform/organizations"
            element={
              <RequirePlatform roles={['SUPER_ADMIN', 'SUPPORT']}>
                <PlatformOrgsPage />
              </RequirePlatform>
            }
          />
          <Route
            path="/platform/onboard"
            element={
              <RequirePlatform roles={['SUPER_ADMIN']}>
                <OnboardOrgPage />
              </RequirePlatform>
            }
          />
          <Route
            path="/platform/team"
            element={
              <RequirePlatform roles={['SUPER_ADMIN']}>
                <PlatformTeamPage />
              </RequirePlatform>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
