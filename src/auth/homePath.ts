import type { AuthResponse } from '@/types/api'

/** Default landing page after login, per user type. */
export function homePathFor(user: AuthResponse | null | undefined): string {
  if (!user) return '/login'
  if (user.platformRole) return '/platform/statistics'
  if (user.role === 'INVENTORY') return '/products'
  return '/pos'
}
