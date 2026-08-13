import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { messageFromError } from '@/api/client'
import { platformApi } from '@/api/endpoints'
import type { PlatformRole, PlatformUser } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const PLATFORM_ROLES: PlatformRole[] = ['SUPER_ADMIN', 'SUPPORT']

const EMPTY = { email: '', name: '', password: '', platformRole: 'SUPPORT' as PlatformRole }

export function PlatformTeamPage() {
  const [team, setTeam] = useState<PlatformUser[]>([])
  const [loading, setLoading] = useState(true)
  const [edit, setEdit] = useState<PlatformUser | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [addOpen, setAddOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setTeam(await platformApi.listTeam())
    } catch (error) {
      toast.error(messageFromError(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function openAdd() {
    setForm(EMPTY)
    setAddOpen(true)
  }

  function openEdit(u: PlatformUser) {
    setEdit(u)
    setForm({ email: u.email, name: u.name, password: '', platformRole: u.platformRole })
  }

  async function createMember(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      await platformApi.createTeamMember(form)
      toast.success('Platform user created')
      setAddOpen(false)
      void load()
    } catch (error) {
      toast.error(messageFromError(error))
    } finally {
      setBusy(false)
    }
  }

  async function saveMember(event: FormEvent) {
    event.preventDefault()
    if (!edit) return
    setBusy(true)
    try {
      await platformApi.updateTeamMember(edit.userId, {
        email: form.email.trim() || undefined,
        name: form.name.trim() || undefined,
        password: form.password || undefined,
        platformRole: form.platformRole,
      })
      toast.success('Platform user updated')
      setEdit(null)
      void load()
    } catch (error) {
      toast.error(messageFromError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Platform team</h2>
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Add member
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : (
                team.map((u) => (
                  <TableRow key={u.userId}>
                    <TableCell>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.platformRole === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                        {u.platformRole}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(u)}>
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add platform member</DialogTitle>
            <DialogDescription>Creates a login that is not attached to any org.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createMember} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select value={form.platformRole} onValueChange={(v) => setForm({ ...form, platformRole: v as PlatformRole })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={edit !== null} onOpenChange={(open) => !open && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit platform member</DialogTitle>
            <DialogDescription>Leave password blank to keep it unchanged.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveMember} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={form.platformRole}
                onValueChange={(v) => setForm({ ...form, platformRole: v as PlatformRole })}
                disabled={edit?.platformRole === 'SUPER_ADMIN'}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {edit?.platformRole === 'SUPER_ADMIN' && (
                <p className="text-xs text-muted-foreground">The Super Admin role cannot be changed.</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEdit(null)}>
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
