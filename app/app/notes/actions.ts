'use server'

import OpenAI from 'openai'
import { revalidatePath } from 'next/cache'
import {
  deleteNoteForUser,
  formatNotesForSummary,
  getNotesForUser,
  insertNoteForUser,
} from '@/lib/notes'
import { createClient } from '@/lib/supabase/server'

const MAX_NOTES_CHARS = 10_000

export type SummarizeNotesResult = { summary: string } | { error: string }

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

export async function summarizeNotes(): Promise<SummarizeNotesResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to summarize notes.' }
  }

  const { notes, error: loadError } = await getNotesForUser(supabase, user.id)

  if (loadError) {
    return { error: `Could not load notes: ${loadError.message}` }
  }

  if (notes.length === 0) {
    return { error: 'You have no notes to summarize yet.' }
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return {
      error:
        'OpenAI is not configured. Set OPENAI_API_KEY in your .env (see .env.example).',
    }
  }

  let bundle = formatNotesForSummary(notes)
  if (bundle.length > MAX_NOTES_CHARS) {
    bundle = `${bundle.slice(0, MAX_NOTES_CHARS)}\n\n[…truncated for length]`
  }

  try {
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You summarize collections of personal notes for the author. Be concise but capture themes, action items, and important facts when present. Use clear sections or bullets when helpful.',
        },
        {
          role: 'user',
          content: `Here are my notes. Please provide a single cohesive summary:\n\n${bundle}`,
        },
      ],
      temperature: 0.4,
    })

    const text = completion.choices[0]?.message?.content?.trim()
    if (!text) {
      return { error: 'The model returned an empty summary. Try again.' }
    }

    return { summary: text }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return { error: `OpenAI request failed: ${message}` }
  }
}
