import { describe, expect, it } from 'vitest'
import { canAccessPlatform, canAccessRoles } from './access'
import { homePathFor } from './homePath'
import type { AuthResponse } from '@/types/api'

function orgUser(role: AuthResponse['role']): AuthResponse {
  return { token: 't', userId: '1', email: 'a@b.c', name: 'A', role, platformRole: null }
}

describe('access', () => {
  it('org user can access matching roles only', () => {
    expect(canAccessRoles(orgUser('ADMIN'), ['ADMIN', 'SALES'])).toBe(true)
    expect(canAccessRoles(orgUser('SALES'), ['ADMIN'])).toBe(false)
    expect(canAccessRoles(orgUser('INVENTORY'), ['ADMIN', 'SALES'])).toBe(false)
  })

  it('platform user is denied org-role access', () => {
    const platform = { ...orgUser('ADMIN'), role: null, platformRole: 'SUPPORT' as const }
    expect(canAccessRoles(platform, ['ADMIN'])).toBe(false)
  })

  it('platform user can access matching platform roles only', () => {
    const support = { ...orgUser('ADMIN'), role: null, platformRole: 'SUPPORT' as const }
    const superAdmin = { ...orgUser('ADMIN'), role: null, platformRole: 'SUPER_ADMIN' as const }
    expect(canAccessPlatform(support, ['SUPER_ADMIN', 'SUPPORT'])).toBe(true)
    expect(canAccessPlatform(support, ['SUPER_ADMIN'])).toBe(false)
    expect(canAccessPlatform(superAdmin, ['SUPER_ADMIN'])).toBe(true)
    expect(canAccessPlatform(orgUser('ADMIN'), ['SUPPORT'])).toBe(false)
  })

  it('null user can access nothing', () => {
    expect(canAccessRoles(null, ['ADMIN'])).toBe(false)
    expect(canAccessPlatform(null, ['SUPPORT'])).toBe(false)
  })
})

describe('homePathFor (redirect-loop regression)', () => {
  it('platform users land on platform statistics', () => {
    expect(homePathFor({ ...orgUser('ADMIN'), role: null, platformRole: 'SUPER_ADMIN' as const })).toBe(
      '/platform/statistics',
    )
    expect(homePathFor({ ...orgUser('ADMIN'), role: null, platformRole: 'SUPPORT' as const })).toBe(
      '/platform/statistics',
    )
  })

  it('inventory lands on products (never /pos)', () => {
    expect(homePathFor(orgUser('INVENTORY'))).toBe('/products')
  })

  it('admin and sales land on pos', () => {
    expect(homePathFor(orgUser('ADMIN'))).toBe('/pos')
    expect(homePathFor(orgUser('SALES'))).toBe('/pos')
  })

  it('unauthenticated goes to login', () => {
    expect(homePathFor(null)).toBe('/login')
  })
})
