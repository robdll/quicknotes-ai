import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getNotesForUser } from '@/lib/notes'
import { deleteNote } from './notes/actions'
import { signout } from './login/actions'
import { CreateNoteDialog } from '@/components/create-note-dialog'
import { SummarizeNotesDialog } from '@/components/summarize-notes-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// =============================================================================
// QUICKNOTES AI - TECHNICAL ASSESSMENT
// =============================================================================
// DATABASE SCHEMA:
// notes (id, user_id, title, content, created_at, updated_at)

export default async function NotesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { notes, error: notesError } = await getNotesForUser(supabase, user.id)

  if (notesError) {
    console.error('Failed to load notes:', notesError.message)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QuickNotes AI</h1>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
          <form action={signout}>
            <Button variant="outline" type="submit">
              Sign Out
            </Button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">My Notes</h2>
          <div className="flex gap-3">
            <SummarizeNotesDialog hasNotes={notes.length > 0} />

            <CreateNoteDialog />
          </div>
        </div>

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

        {notes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No notes yet. Create your first note!</p>
            <CreateNoteDialog triggerLabel="+ Create Note" />
          </div>
        )}
      </main>
    </div>
  )
}
