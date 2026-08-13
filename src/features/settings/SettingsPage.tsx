import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { messageFromError } from '@/api/client'
import { orgApi } from '@/api/endpoints'
import { useAuth } from '@/auth/context'
import type { OrgRole, OrgUser } from '@/types/api'
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

const ROLES: OrgRole[] = ['ADMIN', 'SALES', 'INVENTORY']

export function SettingsPage() {
  const { user } = useAuth()
  const [orgName, setOrgName] = useState('')
  const [currency, setCurrency] = useState('')
  const [users, setUsers] = useState<OrgUser[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', name: '', password: '', role: 'SALES' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const [s, u] = await Promise.all([orgApi.settings(), orgApi.users()])
      setOrgName(s.orgName)
      setCurrency(s.currency)
      setUsers(u)
    } catch (error) {
      toast.error(messageFromError(error))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function saveSettings(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const updated = await orgApi.updateSettings(orgName, currency)
      setOrgName(updated.orgName)
      setCurrency(updated.currency)
      toast.success('Settings saved')
    } catch (error) {
      toast.error(messageFromError(error))
    } finally {
      setSaving(false)
    }
  }

  async function addUser(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await orgApi.addUser(newUser)
      toast.success('User added')
      setAddOpen(false)
      setNewUser({ email: '', name: '', password: '', role: 'SALES' })
      void load()
    } catch (error) {
      toast.error(messageFromError(error))
    } finally {
      setSaving(false)
    }
  }

  async function changeRole(u: OrgUser, role: OrgRole) {
    try {
      await orgApi.changeRole(u.userId, role)
      toast.success('Role updated')
      void load()
    } catch (error) {
      toast.error(messageFromError(error))
    }
  }

  async function removeUser(u: OrgUser) {
    try {
      await orgApi.removeUser(u.userId)
      toast.success('User removed')
      void load()
    } catch (error) {
      toast.error(messageFromError(error))
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveSettings} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Shop name</Label>
              <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={10} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Users</CardTitle>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Add user
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.userId}>
                  <TableCell>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(v) => void changeRole(u, v as OrgRole)}
                      disabled={u.userId === user?.userId}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive"
                      title="Remove"
                      disabled={u.userId === user?.userId}
                      onClick={() => void removeUser(u)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>Give the new staff member a login.</DialogDescription>
          </DialogHeader>
          <form onSubmit={addUser} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
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
              <Button type="submit" disabled={saving}>
                {saving ? 'Adding…' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
