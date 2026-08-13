import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/auth/context'
import { canAccessPlatform, canAccessRoles } from '@/auth/access'
import { homePathFor } from '@/auth/homePath'
import type { OrgRole, PlatformRole } from '@/types/api'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function RequireRoles({ roles, children }: { roles: OrgRole[]; children: ReactNode }) {
  const { user } = useAuth()
  if (!canAccessRoles(user, roles)) return <Navigate to="/" replace />
  return <>{children}</>
}

export function RequirePlatform({ roles, children }: { roles: PlatformRole[]; children: ReactNode }) {
  const { user } = useAuth()
  if (!canAccessPlatform(user, roles)) return <Navigate to="/" replace />
  return <>{children}</>
}

export function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={homePathFor(user)} replace />
}
