import { Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Topbar() {
  const { profile, signOut } = useAuth()

  return (
    <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="relative w-72">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar..."
          className="w-full bg-bg border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
        />
      </div>
      <div className="flex items-center gap-4">
        {profile && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted">@{profile.username}</span>
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-medium text-white">
                {profile.name?.charAt(0) ?? '?'}
              </div>
            )}
            <button
              onClick={signOut}
              className="text-sm text-text-muted hover:text-text transition-colors"
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
