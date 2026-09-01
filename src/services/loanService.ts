import { supabase } from '../lib/supabase'
import type { Loan, LoanPayment } from '../types'

export async function getLoans(userId: string): Promise<Loan[]> {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createLoan(loan: Omit<Loan, 'id'>): Promise<Loan> {
  const { data, error } = await supabase.from('loans').insert(loan).select().single()
  if (error) throw error
  return data
}

export async function updateLoan(id: string, updates: Partial<Loan>): Promise<Loan> {
  const { data, error } = await supabase.from('loans').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteLoan(id: string): Promise<void> {
  const { error } = await supabase.from('loans').delete().eq('id', id)
  if (error) throw error
}

export async function getLoanPayments(loanId: string): Promise<LoanPayment[]> {
  const { data, error } = await supabase
    .from('loan_payments')
    .select('*')
    .eq('loan_id', loanId)
    .order('date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createLoanPayment(payment: Omit<LoanPayment, 'id'>): Promise<LoanPayment> {
  const { data, error } = await supabase.from('loan_payments').insert(payment).select().single()
  if (error) throw error
  return data
}

export async function deleteLoanPayment(id: string): Promise<void> {
  const { error } = await supabase.from('loan_payments').delete().eq('id', id)
  if (error) throw error
}
