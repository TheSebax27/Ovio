import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppLayout from '../components/layout/AppLayout'
import LandingPage from '../pages/landing/LandingPage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterUsernamePage from '../pages/auth/RegisterUsernamePage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import FinancePage from '../pages/finance/FinancePage'
import EntertainmentPage from '../pages/entertainment/EntertainmentPage'
import EventsPage from '../pages/events/EventsPage'
import JournalPage from '../pages/journal/JournalPage'
import PlacesPage from '../pages/places/PlacesPage'
import PremiumPage from '../pages/premium/PremiumPage'
import CalendarPage from '../pages/calendar/CalendarPage'
import SettingsPage from '../pages/settings/SettingsPage'
import SearchUsersPage from '../pages/social/SearchUsersPage'
import SocialFeedPage from '../pages/social/SocialFeedPage'
import PublicProfilePage from '../pages/social/PublicProfilePage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!profile?.username) return <Navigate to="/register" replace />

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()

  if (loading) return null
  if (user && profile?.username) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<RegisterUsernamePage />} />

        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/entertainment" element={<EntertainmentPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/places" element={<PlacesPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/premium" element={<PremiumPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/social/search" element={<SearchUsersPage />} />
          <Route path="/social/feed" element={<SocialFeedPage />} />
          <Route path="/u/:username" element={<PublicProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
