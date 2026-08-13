import type { AuthResponse } from '@/types/api'

export function canAccessRoles(user: AuthResponse | null | undefined, roles: string[]): boolean {
  return !!user && !user.platformRole && !!user.role && roles.includes(user.role)
}

export function canAccessPlatform(user: AuthResponse | null | undefined, roles: string[]): boolean {
  return !!user?.platformRole && roles.includes(user.platformRole)
}
