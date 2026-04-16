'use server'

import { revalidatePath } from 'next/cache'
import { deleteNoteForUser, insertNoteForUser } from '@/lib/notes'
import { createClient } from '@/lib/supabase/server'

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

  const { error } = await insertNoteForUser(supabase, user.id, {
    title,
    content,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return {}
}

export async function deleteNote(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error('deleteNote: not signed in')
    return
  }

  const rawId = formData.get('noteId')
  if (typeof rawId !== 'string' || rawId.length === 0) {
    console.error('deleteNote: missing noteId')
    return
  }

  const { error } = await deleteNoteForUser(supabase, user.id, rawId)

  if (error) {
    console.error('deleteNote:', error.message)
    return
  }

  revalidatePath('/')
}
