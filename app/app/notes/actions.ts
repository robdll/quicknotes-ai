'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type NoteInsert = Database['public']['Tables']['notes']['Insert']

export async function createNote(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to create a note.' }
  }

  const title = (formData.get('title') as string)?.trim()
  const rawContent = formData.get('content')
  const content =
    typeof rawContent === 'string' && rawContent.trim().length > 0
      ? rawContent.trim()
      : null

  if (!title) {
    return { error: 'Title is required.' }
  }

  const row: NoteInsert = {
    user_id: user.id,
    title,
    content,
  }

  // Hand-written `Database` + `createServerClient` currently infer `.insert()` as `never`; 
  // insert is valid at runtime (RLS allows authenticated inserts).
  // @ts-expect-error — see above
  const { error } = await supabase.from('notes').insert(row)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return {}
}
