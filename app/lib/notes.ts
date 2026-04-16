import type { PostgrestError } from '@supabase/supabase-js'
import type { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

export type NoteRow = Database['public']['Tables']['notes']['Row']
type NoteInsert = Database['public']['Tables']['notes']['Insert']

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

/** Notes per page on the home grid (`getNotesForUser` with `page` option). */
export const NOTES_PAGE_SIZE = 5

export type GetNotesPageOptions = { limit: number; offset: number }

export async function getNotesForUser(
  supabase: ServerSupabase,
  userId: string,
  page?: GetNotesPageOptions
): Promise<{
  notes: NoteRow[]
  error: PostgrestError | null
  hasMore?: boolean
}> {
  let query = supabase
    .from('notes')
    .select('id, user_id, title, content, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (page) {
    const { limit, offset } = page
    // Fetch one extra row to detect a following page without a separate count query.
    query = query.range(offset, offset + limit)
  }

  const { data, error } = await query

  if (page) {
    const { limit } = page
    const rows = data ?? []
    const hasMore = rows.length > limit
    const notes = hasMore ? rows.slice(0, limit) : rows
    return { notes, error, hasMore }
  }

  return { notes: data ?? [], error }
}

export async function insertNoteForUser(
  supabase: ServerSupabase,
  userId: string,
  values: { title: string; content: string | null }
): Promise<{ error: PostgrestError | null }> {
  const row: NoteInsert = {
    user_id: userId,
    title: values.title,
    content: values.content,
  }

  // Hand-written `Database` + `createServerClient` infer `.insert()` as `never`; insert is valid at runtime (RLS).
  // @ts-expect-error — see above
  const { error } = await supabase.from('notes').insert(row)

  return { error }
}

export async function deleteNoteForUser(
  supabase: ServerSupabase,
  userId: string,
  noteId: string
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId)

  return { error }
}

/** Plain-text bundle of all notes for LLM summarization. */
export function formatNotesForSummary(notes: NoteRow[]): string {
  return notes
    .map(
      (n, i) =>
        `### Note ${i + 1}: ${n.title}\n${(n.content ?? '').trim()}`
    )
    .join('\n\n---\n\n')
}
