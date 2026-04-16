'use client'

import { useEffect, useState, useTransition } from 'react'
import { deleteNote, loadMoreNotes } from '@/app/notes/actions'
import { NOTES_PAGE_SIZE, type NoteRow } from '@/lib/notes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type NotesGridProps = {
  initialNotes: NoteRow[]
  initialHasMore: boolean
}

export function NotesGrid({ initialNotes, initialHasMore }: NotesGridProps) {
  const [notes, setNotes] = useState<NoteRow[]>(initialNotes)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setNotes(initialNotes)
    setHasMore(initialHasMore)
  }, [initialNotes, initialHasMore])

  function handleLoadMore() {
    setLoadError(null)
    startTransition(async () => {
      const result = await loadMoreNotes(notes.length)
      if ('error' in result) {
        setLoadError(result.error)
        return
      }
      setNotes((prev) => [...prev, ...result.notes])
      setHasMore(result.hasMore)
    })
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <Card key={note.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{note.title}</CardTitle>
                <form action={deleteNote} className="shrink-0">
                  <input type="hidden" name="noteId" value={note.id} />
                  <Button variant="ghost" size="sm" type="submit">
                    Delete
                  </Button>
                </form>
              </div>
              <CardDescription>
                {new Date(note.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 line-clamp-4">
                {note.content ?? ''}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleLoadMore}
            disabled={isPending}
          >
            {isPending ? 'Loading…' : `Load more (${NOTES_PAGE_SIZE} at a time)`}
          </Button>
          {loadError && (
            <p className="text-sm text-red-600" role="alert">
              {loadError}
            </p>
          )}
        </div>
      )}
    </>
  )
}
