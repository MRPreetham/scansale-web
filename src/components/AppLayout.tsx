import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, ShoppingCart, Package, FileUp, BarChart3, Settings, Building2, LayoutDashboard, Users } from 'lucide-react'
import { useAuth } from '@/auth/context'
import { cn } from '@/lib/utils'
import type { OrgRole, PlatformRole } from '@/types/api'

interface NavItem {
  to: string
  label: string
  icon: typeof Package
  roles?: OrgRole[]
  platformOnly?: boolean
  platformRoles?: PlatformRole[]
  supportLabel?: string
}

const NAV: NavItem[] = [
  { to: '/pos', label: 'Counter', icon: ShoppingCart, roles: ['ADMIN', 'SALES'] },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/imports', label: 'Import', icon: FileUp, roles: ['ADMIN', 'INVENTORY'] },
  { to: '/reports', label: 'Daily Report', icon: BarChart3, roles: ['ADMIN', 'INVENTORY'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['ADMIN'] },
  {
    to: '/platform/statistics',
    label: 'Platform Statistics',
    icon: LayoutDashboard,
    platformOnly: true,
    platformRoles: ['SUPER_ADMIN', 'SUPPORT'],
  },
  {
    to: '/platform/organizations',
    label: 'Manage Organizations',
    icon: Building2,
    platformOnly: true,
    platformRoles: ['SUPER_ADMIN', 'SUPPORT'],
    supportLabel: 'Organization Help',
  },
  {
    to: '/platform/onboard',
    label: 'Onboard Organization',
    icon: Building2,
    platformOnly: true,
    platformRoles: ['SUPER_ADMIN'],
  },
  {
    to: '/platform/team',
    label: 'Platform Team',
    icon: Users,
    platformOnly: true,
    platformRoles: ['SUPER_ADMIN'],
  },
]

export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const items = NAV.filter((item) => {
    if (user?.platformRole) {
      if (!item.platformOnly) return false
      return item.platformRoles ? item.platformRoles.includes(user.platformRole) : true
    }
    if (item.platformOnly) return false
    if (item.roles) return user ? item.roles.includes(user.role!) : false
    return true
  })

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const scope = user?.platformRole === 'SUPER_ADMIN'
    ? 'Super Admin'
    : user?.platformRole === 'SUPPORT'
      ? 'Support'
      : user?.role === 'INVENTORY'
        ? 'Inventory Manager'
        : user?.role
          ? `Org ${user.role[0]}${user.role.slice(1).toLowerCase()}`
          : ''

  return (
    <div className="flex h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r bg-sidebar">
        <div className="flex items-center gap-2 border-b px-4 py-4">
          <img src="/logo.svg" alt="ScanSale" className="size-8 rounded-md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user?.orgName ?? 'ScanSale'}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.name}</p>
            {scope && scope.toLowerCase() !== user?.name?.toLowerCase() && (
              <p className="truncate text-xs font-medium text-muted-foreground">{scope}</p>
            )}
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <item.icon className="size-4" />
              {user?.platformRole === 'SUPPORT' && item.supportLabel ? item.supportLabel : item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-background p-6">
        <Outlet />
      </main>
    </div>
  )
}

