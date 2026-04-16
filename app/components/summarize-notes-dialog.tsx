'use client'

import { useRef, useState } from 'react'
import { summarizeNotes } from '@/app/notes/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type SummarizeNotesDialogProps = {
  hasNotes: boolean
}

export function SummarizeNotesDialog({ hasNotes }: SummarizeNotesDialogProps) {
  const generation = useRef(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const closeModal = () => {
    generation.current += 1
    setOpen(false)
    setLoading(false)
    setError(null)
    setSummary(null)
  }

  const runSummarize = async () => {
    const id = ++generation.current
    setOpen(true)
    setLoading(true)
    setError(null)
    setSummary(null)
    try {
      const result = await summarizeNotes()
      if (generation.current !== id) return
      if ('error' in result) {
        setError(result.error)
        return
      }
      setSummary(result.summary)
    } finally {
      if (generation.current === id) {
        setLoading(false)
      }
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={closeModal}
        >
          <Card
            className="max-h-[85vh] w-full max-w-2xl overflow-hidden shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 shrink-0">
              <div className="space-y-1.5">
                <CardTitle>AI summary</CardTitle>
                <CardDescription>
                  Generated from all of your notes (newest first in the source data).
                </CardDescription>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={closeModal}>
                Close
              </Button>
            </CardHeader>
            <CardContent className="min-h-[120px] flex-1 overflow-y-auto space-y-3">
              {loading && (
                <p className="text-sm text-muted-foreground">Generating summary…</p>
              )}
              {!loading && error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}
              {!loading && summary && (
                <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {summary}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      <Button
        type="button"
        variant="secondary"
        disabled={!hasNotes || loading}
        title={!hasNotes ? 'Add at least one note to summarize' : undefined}
        onClick={() => void runSummarize()}
      >
        AI Summarize
      </Button>
    </>
  )
}
