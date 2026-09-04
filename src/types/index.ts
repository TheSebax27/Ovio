export interface Profile {
  id: string
  email: string
  name: string
  username: string
  username_lower: string
  avatar_url: string | null
  bio: string
  is_public: boolean
  followers_count: number
  following_count: number
  plan: 'free' | 'pro'
  drive_folder_id: string | null
  created_at: string
}

export interface PrivacySettings {
  user_id: string
  show_finances: boolean
  show_movies: boolean
  show_events: boolean
  show_journal: boolean
  show_places: boolean
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface SearchUserResult {
  id: string
  username: string
  name: string
  avatar_url: string | null
  bio: string
  followers_count: number
  following_count: number
  is_following: boolean
}

export interface SocialFeedItem {
  item_type: 'movie' | 'event' | 'place' | 'journal'
  item_id: string
  user_id: string
  username: string
  avatar_url: string | null
  title: string
  subtitle: string
  created_date: string
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
  drive_image: string | null
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
  drive_image: string | null
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

export interface Task {
  id: string
  user_id: string
  title: string
  description: string
  date: string
  time: string | null
  priority: 'low' | 'medium' | 'high'
  completed: boolean
  gcal_event_id: string | null
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer: string
  stripe_subscription: string
  status: 'active' | 'canceled'
  renewal_date: string | null
}
