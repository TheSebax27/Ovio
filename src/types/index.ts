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

export interface Subscription {
  id: string
  user_id: string
  stripe_customer: string
  stripe_subscription: string
  status: 'active' | 'canceled'
  renewal_date: string | null
}
