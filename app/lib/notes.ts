import type { PostgrestError } from '@supabase/supabase-js'
import type { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

export type NoteRow = Database['public']['Tables']['notes']['Row']

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

export async function getNotesForUser(
  supabase: ServerSupabase,
  userId: string
): Promise<{ notes: NoteRow[]; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('notes')
    .select('id, user_id, title, content, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { notes: data ?? [], error }
}
