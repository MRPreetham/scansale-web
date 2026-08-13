import type { ReactNode } from 'react'
import type { PlatformOrgSummary } from '@/types/api'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Props {
  orgs: PlatformOrgSummary[]
  loading: boolean
  actions?: (org: PlatformOrgSummary) => ReactNode
}

export function OrgsTable({ orgs, loading, actions }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Org</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Admin</TableHead>
          <TableHead className="text-right">Users</TableHead>
          <TableHead>Onboarded</TableHead>
          {actions && <TableHead className="w-40 text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={actions ? 6 : 5} className="h-20 text-center text-muted-foreground">
              Loading…
            </TableCell>
          </TableRow>
        ) : (
          orgs.map((o) => (
            <TableRow key={o.orgId}>
              <TableCell>
                <p className="font-medium">{o.orgName}</p>
                <p className="text-xs text-muted-foreground">{o.currency}</p>
              </TableCell>
              <TableCell>
                <Badge variant={o.status === 'ACTIVE' ? 'secondary' : 'destructive'}>{o.status}</Badge>
              </TableCell>
              <TableCell className="text-xs">{o.adminEmail ?? '—'}</TableCell>
              <TableCell className="text-right tabular-nums">{o.userCount}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(o.createdAt).toLocaleDateString()}
              </TableCell>
              {actions && <TableCell>{actions(o)}</TableCell>}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
