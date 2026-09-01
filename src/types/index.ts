export interface Profile {
  id: string
  email: string
  name: string
  username: string
  username_lower: string
  avatar_url: string | null
  plan: 'free' | 'pro'
  drive_folder_id: string | null
  created_at: string
}

export interface Finance {
  id: string
  user_id: string
  type: 'income' | 'expense'
  title: string
  amount: number
  category: string
  note: string | null
  date: string
}

export interface Movie {
  id: string
  user_id: string
  title: string
  media_type: 'movie' | 'series'
  status: 'watching' | 'completed' | 'planned'
  rating: number | null
  poster_url: string | null
  watched_at: string | null
}

export interface Event {
  id: string
  user_id: string
  title: string
  type: 'concert' | 'match'
  city: string
  venue: string
  event_date: string
  drive_cover: string | null
  notes: string | null
}

export interface JournalEntry {
  id: string
  user_id: string
  title: string
  content: string
  mood: number | null
  created_at: string
}

export interface JournalImage {
  id: string
  journal_id: string
  drive_file_id: string
}

export interface Place {
  id: string
  user_id: string
  name: string
  city: string
  country: string
  rating: number | null
  visited_at: string | null
}

export interface Loan {
  id: string
  user_id: string
  type: 'given' | 'received'
  person: string
  amount: number
  note: string | null
  status: 'pending' | 'paid'
  created_at: string
}

export interface LoanPayment {
  id: string
  loan_id: string
  amount: number
  note: string | null
  date: string
}

export interface SavingsGoal {
  id: string
  user_id: string
  title: string
  target_amount: number
  current_amount: number
  deadline: string | null
  status: 'active' | 'completed'
  created_at: string
}

export interface SavingsContribution {
  id: string
  goal_id: string
  amount: number
  note: string | null
  date: string
}

export interface Budget {
  id: string
  user_id: string
  category: string
  limit_amount: number
  month: number
  year: number
}

export interface FixedExpense {
  id: string
  user_id: string
  title: string
  amount: number
  category: string
  due_day: number
  is_active: boolean
}

export interface FixedExpensePayment {
  id: string
  fixed_expense_id: string
  month: number
  year: number
  paid_at: string | null
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer: string
  stripe_subscription: string
  status: 'active' | 'canceled'
  renewal_date: string | null
}
