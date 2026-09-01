import { supabase } from '../lib/supabase'
import type { Event } from '../types'

export async function getEvents(userId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .order('event_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createEvent(event: Omit<Event, 'id'>): Promise<Event> {
  const { data, error } = await supabase.from('events').insert(event).select().single()
  if (error) throw error
  return data
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
  const { data, error } = await supabase.from('events').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}
