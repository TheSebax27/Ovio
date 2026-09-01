import { supabase } from '../lib/supabase'
import type { Budget } from '../types'

export async function getBudgets(userId: string, month: number, year: number): Promise<Budget[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)
  if (error) throw error
  return data ?? []
}

export async function upsertBudget(budget: Omit<Budget, 'id'>): Promise<Budget> {
  const { data, error } = await supabase
    .from('budgets')
    .upsert(budget, { onConflict: 'user_id,category,month,year' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase.from('budgets').delete().eq('id', id)
  if (error) throw error
}
