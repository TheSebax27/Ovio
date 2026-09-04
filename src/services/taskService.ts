import { supabase } from '../lib/supabase'
import type { Task } from '../types'

export async function getTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true })
    .order('time', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createTask(task: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
  const { data, error } = await supabase.from('tasks').insert(task).select().single()
  if (error) throw error
  return data
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const { error } = await supabase.from('tasks').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export async function toggleTask(id: string, completed: boolean): Promise<void> {
  const { error } = await supabase.from('tasks').update({ completed }).eq('id', id)
  if (error) throw error
}
