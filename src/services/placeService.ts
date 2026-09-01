import { supabase } from '../lib/supabase'
import type { Place } from '../types'

export async function getPlaces(userId: string): Promise<Place[]> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('user_id', userId)
    .order('visited_at', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data ?? []
}

export async function createPlace(place: Omit<Place, 'id'>): Promise<Place> {
  const { data, error } = await supabase.from('places').insert(place).select().single()
  if (error) throw error
  return data
}

export async function updatePlace(id: string, updates: Partial<Place>): Promise<Place> {
  const { data, error } = await supabase.from('places').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deletePlace(id: string): Promise<void> {
  const { error } = await supabase.from('places').delete().eq('id', id)
  if (error) throw error
}
