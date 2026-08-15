import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { FileUp, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { messageFromError } from '@/api/client'
import { importApi } from '@/api/endpoints'
import { FIELD_LABELS, MAPPING_FIELDS, detectMapping, readCsvColumns, type MappingField } from '@/features/imports/csvMapping'
import type { ColumnMapping, ImportHistory, ImportPreview } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

const PAGE_SIZE = 50
const NONE = '__none__'

export function ImportsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [fileHeaders, setFileHeaders] = useState<string[]>([])
  const [fileSample, setFileSample] = useState<string[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [carton, setCarton] = useState(false)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [committed, setCommitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState<ImportHistory[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadHistory = useCallback(async () => {
    try {
      const result = await importApi.history({ page, size: PAGE_SIZE })
      setHistory(result.items)
      setTotal(result.total)
    } catch {
      /* ignore */
    }
  }, [page])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setPreview(null)
    setCommitted(false)
    if (selected) {
      const { headers, sample } = await readCsvColumns(selected)
      setFileHeaders(headers)
      setFileSample(sample)
      setMapping(detectMapping(headers))
      setCarton(false)
    } else {
      setFileHeaders([])
      setFileSample([])
      setMapping({})
      setCarton(false)
    }
  }

  async function handlePreview() {
    if (!file || !mapping.barcode) return
    setBusy(true)
    setCommitted(false)
    try {
      setPreview(await importApi.preview(file, mapping, carton))
    } catch (error) {
      toast.error(messageFromError(error))
    } finally {
      setBusy(false)
    }
  }

  async function handleCommit() {
    if (!preview) return
    setBusy(true)
    try {
      await importApi.commit(preview.importId)
      toast.success('Import committed')
      setCommitted(true)
      setPreview(null)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      void loadHistory()
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
          <CardTitle>Import inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => void onFileChange(e)}
            />
            <Button
              type="button"
              variant={file ? 'secondary' : 'outline'}
              onClick={() => inputRef.current?.click()}
              title={file ? 'Choose a different file' : 'Choose a CSV file'}
            >
              <FileUp className="size-4" />
              {file ? file.name : 'Choose file'}
            </Button>
            {file && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null)
                  setPreview(null)
                  setFileHeaders([])
                  setFileSample([])
                  setMapping({})
                  setCarton(false)
                  if (inputRef.current) inputRef.current.value = ''
                }}
              >
                Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Upload a supplier CSV, map its columns, then preview before committing. Existing
            barcodes get their stock increased; new barcodes create a product.
          </p>

          {file && !preview && (
            <div className="space-y-3 rounded-md border p-4">
              <div>
                <p className="font-medium">Map columns</p>
                <p className="text-xs text-muted-foreground">
                  Match each file column to a field. Barcode is required.
                </p>
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={carton}
                  onChange={(e) => setCarton(e.target.checked)}
                />
                <span>
                  Price is per <strong>carton</strong> — compute per-piece price from the count in
                  the Name (e.g. <code>180MLx48Btls</code>) and add stock as qty × bottles.
                </span>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {MAPPING_FIELDS.map((field: MappingField) => {
                  const mappedHeader = mapping[field]
                  const sampleIndex = mappedHeader ? fileHeaders.indexOf(mappedHeader) : -1
                  const sample = sampleIndex >= 0 ? fileSample[sampleIndex] : undefined
                  return (
                    <div key={field} className="space-y-1.5">
                      <Label>
                        {FIELD_LABELS[field]}
                        {field === 'barcode' ? ' *' : ''}
                      </Label>
                      <Select
                        value={mappedHeader ?? NONE}
                        onValueChange={(v) =>
                          setMapping((m) => ({ ...m, [field]: v === NONE ? undefined : v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Not used" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>Not used</SelectItem>
                          {fileHeaders.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="truncate text-xs text-muted-foreground">
                        {mappedHeader
                          ? sample
                            ? `e.g. ${sample}`
                            : `e.g. —`
                          : 'Not used'}
                      </p>
                    </div>
                  )
                })}
              </div>
              <Button onClick={() => void handlePreview()} disabled={!mapping.barcode || busy}>
                <FileUp className="size-4" />
                {busy ? 'Working…' : 'Confirm mapping & preview'}
              </Button>
              {!mapping.barcode && (
                <p className="text-xs text-muted-foreground">Select a barcode column to continue.</p>
              )}
            </div>
          )}

          {preview && (
            <div className="space-y-3 rounded-md border p-4">
              <div className="flex items-center gap-4 text-sm">
                <span>
                  New: <strong>{preview.newCount}</strong>
                </span>
                <span>
                  Update: <strong>{preview.updateCount}</strong>
                </span>
                <span>
                  Skipped: <strong>{preview.skipCount}</strong>
                </span>
              </div>
              {preview.errors.length > 0 && (
                <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-destructive">
                  {preview.errors.map((e) => (
                    <li key={e.row}>
                      Row {e.row}: {e.message}
                    </li>
                  ))}
                </ul>
              )}
              <Button onClick={() => void handleCommit()} disabled={busy || preview.errors.length > 0}>
                <CheckCircle2 className="size-4" />
                {busy ? 'Working…' : 'Commit import'}
              </Button>
              {preview.errors.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Fix the errors in the file before committing.
                </p>
              )}
            </div>
          )}
          {committed && (
            <p className="text-sm text-green-600">Import committed successfully.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">New</TableHead>
                <TableHead className="text-right">Updated</TableHead>
                <TableHead className="text-right">Skipped</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                    No imports yet
                  </TableCell>
                </TableRow>
              ) : (
                history.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.filename}</TableCell>
                    <TableCell>{h.status}</TableCell>
                    <TableCell className="text-right tabular-nums">{h.newCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{h.updateCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{h.skipCount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(h.importedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <div className="flex items-center justify-between border-t p-3 text-sm text-muted-foreground">
          <span>{total} import{total === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="tabular-nums">
              Page {page + 1} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
