import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { messageFromError } from '@/api/client'
import { platformApi } from '@/api/endpoints'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function OnboardOrgPage() {
  const [form, setForm] = useState({
    orgName: '',
    currency: 'INR',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  })
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ orgName: string; adminEmail: string } | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setResult(null)
    try {
      const org = await platformApi.onboard(form)
      setResult({ orgName: org.orgName, adminEmail: org.adminEmail })
      toast.success(`Organization "${org.orgName}" created`)
      setForm({ orgName: '', currency: 'INR', adminName: '', adminEmail: '', adminPassword: '' })
    } catch (error) {
      toast.error(messageFromError(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Onboard a new organization</CardTitle>
          <CardDescription>Creates the org and its first admin account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Organization name *</Label>
              <Input
                value={form.orgName}
                onChange={(e) => setForm({ ...form, orgName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Input
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                maxLength={10}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Admin name *</Label>
              <Input
                value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Admin email *</Label>
              <Input
                type="email"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Admin password *</Label>
              <Input
                type="password"
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Creating…' : 'Create organization'}
            </Button>
            {result && (
              <p className="text-sm text-green-600">
                Created {result.orgName} — admin login is {result.adminEmail}.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
