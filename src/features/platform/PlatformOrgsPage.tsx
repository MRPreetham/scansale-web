import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Pencil, Pause, Play } from 'lucide-react'
import { toast } from 'sonner'
import { messageFromError } from '@/api/client'
import { platformApi } from '@/api/endpoints'
import { useAuth } from '@/auth/context'
import type { PlatformOrgSummary } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { OrgsTable } from '@/features/platform/OrgsTable'

export function PlatformOrgsPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.platformRole === 'SUPER_ADMIN'
  const [orgs, setOrgs] = useState<PlatformOrgSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [editOrg, setEditOrg] = useState<PlatformOrgSummary | null>(null)
  const [editForm, setEditForm] = useState({ email: '', name: '', password: '' })
  const [busy, setBusy] = useState(false)

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

  async function toggleStatus(org: PlatformOrgSummary) {
    const next = org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    setBusy(true)
    try {
      await platformApi.setOrgStatus(org.orgId, next)
      toast.success(`${org.orgName} ${next === 'ACTIVE' ? 'resumed' : 'suspended'}`)
      void load()
    } catch (error) {
      toast.error(messageFromError(error))
    } finally {
      setBusy(false)
    }
  }

  function openEdit(org: PlatformOrgSummary) {
    setEditOrg(org)
    setEditForm({ email: org.adminEmail ?? '', name: '', password: '' })
  }

  async function saveAdmin(event: FormEvent) {
    event.preventDefault()
    if (!editOrg) return
    setBusy(true)
    try {
      await platformApi.updateAdmin(editOrg.orgId, {
        email: editForm.email.trim() || undefined,
        name: editForm.name.trim() || undefined,
        password: editForm.password || undefined,
      })
      toast.success('Admin details updated')
      setEditOrg(null)
      void load()
    } catch (error) {
      toast.error(messageFromError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{isSuperAdmin ? 'Manage organizations' : 'Organization Help'}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <OrgsTable
            orgs={orgs}
            loading={loading}
            actions={(o) => (
              <div className="flex justify-end gap-1">
                {isSuperAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    title={o.status === 'ACTIVE' ? 'Suspend' : 'Resume'}
                    onClick={() => void toggleStatus(o)}
                  >
                    {o.status === 'ACTIVE' ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                    {o.status === 'ACTIVE' ? 'Suspend' : 'Resume'}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => openEdit(o)}>
                  <Pencil className="size-3.5" />
                  Edit admin
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={editOrg !== null} onOpenChange={(open) => !open && setEditOrg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update org admin</DialogTitle>
            <DialogDescription>{editOrg?.orgName} — leave a field blank to keep it unchanged.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveAdmin} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOrg(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
