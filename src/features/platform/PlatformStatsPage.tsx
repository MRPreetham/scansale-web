import { useCallback, useEffect, useState } from 'react'
import { Building, Users } from 'lucide-react'
import { toast } from 'sonner'
import { messageFromError } from '@/api/client'
import { platformApi } from '@/api/endpoints'
import type { PlatformOrgSummary } from '@/types/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OrgsTable } from '@/features/platform/OrgsTable'

export function PlatformStatsPage() {
  const [orgs, setOrgs] = useState<PlatformOrgSummary[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setOrgs(await platformApi.listOrgs())
    } catch (error) {
      toast.error(messageFromError(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const totalUsers = orgs.reduce((sum, o) => sum + o.userCount, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building className="size-4" /> Organizations
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">{orgs.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4" /> Users
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold tabular-nums">{totalUsers}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <OrgsTable orgs={orgs} loading={loading} />
        </CardContent>
      </Card>
    </div>
  )
}
