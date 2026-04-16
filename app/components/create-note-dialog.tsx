'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createNote } from '@/app/notes/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type CreateNoteDialogProps = {
  triggerLabel?: string
  triggerVariant?: 'default' | 'outline' | 'secondary'
  className?: string
}

export function CreateNoteDialog({
  triggerLabel = '+ New Note',
  triggerVariant = 'default',
  className,
}: CreateNoteDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError(null)
    try {
      const result = await createNote(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={() => !loading && setOpen(false)}
        >
          <Card
            className="w-full max-w-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-column items-start justify-between space-y-0 gap-2">
              <CardTitle>New note</CardTitle>
              <CardDescription>Add a title and optional content.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={handleSubmit} className="space-y-3">
                <Label htmlFor="new-note-title">Title</Label>
                <Input
                  id="new-note-title"
                  name="title"
                  placeholder="Note title"
                  required
                  disabled={loading}
                  autoFocus
                />
                <Label htmlFor="new-note-content">Content</Label>
                <Textarea
                  id="new-note-content"
                  name="content"
                  placeholder="Write something…"
                  disabled={loading}
                  rows={5}
                />
                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving…' : 'Save note'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      <Button
        type="button"
        variant={triggerVariant}
        className={className}
        onClick={() => {
          setOpen(true)
          setError(null)
        }}
      >
        {triggerLabel}
      </Button>
    </>
  )
}
