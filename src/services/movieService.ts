import { supabase } from '../lib/supabase'
import type { Movie } from '../types'

export async function getMovies(userId: string): Promise<Movie[]> {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('user_id', userId)
    .order('watched_at', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data ?? []
}

export async function createMovie(movie: Omit<Movie, 'id'>): Promise<Movie> {
  const { data, error } = await supabase.from('movies').insert(movie).select().single()
  if (error) throw error
  return data
}

export async function updateMovie(id: string, updates: Partial<Movie>): Promise<Movie> {
  const { data, error } = await supabase.from('movies').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteMovie(id: string): Promise<void> {
  const { error } = await supabase.from('movies').delete().eq('id', id)
  if (error) throw error
}
