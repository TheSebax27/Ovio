import { supabase } from '../lib/supabase'
import type { SavingsGoal, SavingsContribution } from '../types'

export async function getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createSavingsGoal(goal: Omit<SavingsGoal, 'id'>): Promise<SavingsGoal> {
  const { data, error } = await supabase.from('savings_goals').insert(goal).select().single()
  if (error) throw error
  return data
}

export async function updateSavingsGoal(id: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal> {
  const { data, error } = await supabase.from('savings_goals').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const { error } = await supabase.from('savings_goals').delete().eq('id', id)
  if (error) throw error
}

export async function getContributions(goalId: string): Promise<SavingsContribution[]> {
  const { data, error } = await supabase
    .from('savings_contributions')
    .select('*')
    .eq('goal_id', goalId)
    .order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createContribution(contribution: Omit<SavingsContribution, 'id'>): Promise<SavingsContribution> {
  const { data, error } = await supabase.from('savings_contributions').insert(contribution).select().single()
  if (error) throw error
  return data
}
