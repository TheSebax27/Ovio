import { supabase } from '../lib/supabase'
import type { Finance } from '../types'

export async function getFinances(userId: string): Promise<Finance[]> {
  const { data, error } = await supabase
    .from('finances')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createFinance(finance: Omit<Finance, 'id'>): Promise<Finance> {
  const { data, error } = await supabase
    .from('finances')
    .insert(finance)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateFinance(id: string, updates: Partial<Finance>): Promise<Finance> {
  const { data, error } = await supabase
    .from('finances')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteFinance(id: string): Promise<void> {
  const { error } = await supabase
    .from('finances')
    .delete()
    .eq('id', id)
  if (error) throw error
}
