import { useState, useRef } from 'react'
import { Search, UserPlus, UserMinus, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { searchUsers, followUser, unfollowUser } from '../../services/socialService'
import EmptyState from '../../components/ui/EmptyState'
import type { SearchUserResult } from '../../types'

export default function SearchUsersPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchUserResult[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  function handleSearch(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim() || val.length < 2) { setResults([]); setSearched(false); return }

    debounceRef.current = setTimeout(async () => {
      if (!user) return
      setLoading(true)
      try {
        const data = await searchUsers(val.trim(), user.id)
        setResults(data)
      } catch { setResults([]) }
      setSearched(true)
      setLoading(false)
    }, 400)
  }

  async function handleFollow(targetId: string) {
    try {
      await followUser(targetId)
      setResults((prev) => prev.map((r) =>
        r.id === targetId ? { ...r, is_following: true, followers_count: r.followers_count + 1 } : r
      ))
      toast('Siguiendo')
    } catch { toast('Error al seguir', 'error') }
  }

  async function handleUnfollow(targetId: string) {
    try {
      await unfollowUser(targetId)
      setResults((prev) => prev.map((r) =>
        r.id === targetId ? { ...r, is_following: false, followers_count: Math.max(0, r.followers_count - 1) } : r
      ))
      toast('Dejaste de seguir')
    } catch { toast('Error al dejar de seguir', 'error') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Buscar personas</h1>
      </div>

      <div className="relative max-w-md mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar por nombre o username..."
          className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
          autoFocus
        />
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="bg-surface border border-border rounded-xl">
          <EmptyState icon={Users} title="Sin resultados" description="No encontramos usuarios con ese nombre" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((person) => (
            <div key={person.id} className="bg-surface border border-border rounded-xl px-5 py-4 flex items-center justify-between hover:bg-surface-hover transition-colors">
              <div
                className="flex items-center gap-4 cursor-pointer flex-1 min-w-0"
                onClick={() => navigate(`/u/${person.username}`)}
              >
                {person.avatar_url ? (
                  <img src={person.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-lg font-bold text-white shrink-0">
                    {person.name?.charAt(0) ?? '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{person.name}</p>
                  <p className="text-xs text-text-muted">@{person.username}</p>
                  {person.bio && <p className="text-xs text-text-muted mt-1 truncate">{person.bio}</p>}
                  <p className="text-xs text-text-muted mt-0.5">
                    <span className="font-medium text-text">{person.followers_count}</span> seguidores ·{' '}
                    <span className="font-medium text-text">{person.following_count}</span> siguiendo
                  </p>
                </div>
              </div>
              <button
                onClick={() => person.is_following ? handleUnfollow(person.id) : handleFollow(person.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                  person.is_following
                    ? 'bg-bg border border-border text-text-muted hover:text-error hover:border-error'
                    : 'bg-primary hover:bg-primary-hover text-white'
                }`}
              >
                {person.is_following ? <><UserMinus size={16} /> Siguiendo</> : <><UserPlus size={16} /> Seguir</>}
              </button>
            </div>
          ))}
        </div>
      )}

      {!searched && !loading && (
        <div className="bg-surface border border-border rounded-xl">
          <EmptyState icon={Search} title="Descubre personas" description="Busca por nombre o username para encontrar personas en Ovio" />
        </div>
      )}
    </div>
  )
}
