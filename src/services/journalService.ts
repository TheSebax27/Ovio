import { supabase } from '../lib/supabase'
import type { JournalEntry } from '../types'

export async function getJournalEntries(userId: string): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createJournalEntry(entry: Omit<JournalEntry, 'id'>): Promise<JournalEntry> {
  const { data, error } = await supabase.from('journal').insert(entry).select().single()
  if (error) throw error
  return data
}

export async function updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry> {
  const { data, error } = await supabase.from('journal').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const { error } = await supabase.from('journal').delete().eq('id', id)
  if (error) throw error
}
