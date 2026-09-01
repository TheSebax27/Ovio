import { supabase } from '../lib/supabase'
import type { FixedExpense, FixedExpensePayment } from '../types'

export async function getFixedExpenses(userId: string): Promise<FixedExpense[]> {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('due_day')
  if (error) throw error
  return data ?? []
}

export async function createFixedExpense(expense: Omit<FixedExpense, 'id'>): Promise<FixedExpense> {
  const { data, error } = await supabase.from('fixed_expenses').insert(expense).select().single()
  if (error) throw error
  return data
}

export async function updateFixedExpense(id: string, updates: Partial<FixedExpense>): Promise<FixedExpense> {
  const { data, error } = await supabase.from('fixed_expenses').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteFixedExpense(id: string): Promise<void> {
  const { error } = await supabase.from('fixed_expenses').update({ is_active: false }).eq('id', id)
  if (error) throw error
}

export async function getFixedExpensePayments(expenseId: string, month: number, year: number): Promise<FixedExpensePayment[]> {
  const { data, error } = await supabase
    .from('fixed_expense_payments')
    .select('*')
    .eq('fixed_expense_id', expenseId)
    .eq('month', month)
    .eq('year', year)
  if (error) throw error
  return data ?? []
}

export async function getAllFixedPayments(userId: string, month: number, year: number): Promise<FixedExpensePayment[]> {
  const { data, error } = await supabase
    .from('fixed_expense_payments')
    .select('*, fixed_expenses!inner(user_id)')
    .eq('fixed_expenses.user_id', userId)
    .eq('month', month)
    .eq('year', year)
  if (error) throw error
  return data ?? []
}

export async function markAsPaid(fixedExpenseId: string, month: number, year: number): Promise<FixedExpensePayment> {
  const { data, error } = await supabase
    .from('fixed_expense_payments')
    .upsert(
      { fixed_expense_id: fixedExpenseId, month, year, paid_at: new Date().toISOString().split('T')[0] },
      { onConflict: 'fixed_expense_id,month,year' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}
