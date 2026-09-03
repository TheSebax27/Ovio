import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Film, CalendarDays, MapPin, BookOpen, Rss, Search, UserPlus, UserMinus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getSocialFeed, searchUsers, followUser, unfollowUser } from '../../services/socialService'
import EmptyState from '../../components/ui/EmptyState'
import type { SocialFeedItem, SearchUserResult } from '../../types'

const ICON_MAP = {
  movie: { icon: Film, color: 'bg-primary/10', textColor: 'text-primary' },
  event: { icon: CalendarDays, color: 'bg-secondary/10', textColor: 'text-secondary' },
  place: { icon: MapPin, color: 'bg-success/10', textColor: 'text-success' },
  journal: { icon: BookOpen, color: 'bg-warning/10', textColor: 'text-warning' },
}

export default function SocialFeedPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [feed, setFeed] = useState<SocialFeedItem[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchUserResult[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    if (!user) return
    getSocialFeed(user.id).then((data) => { setFeed(data); setLoading(false) }).catch(() => setLoading(false))
  }, [user])

  function handleSearch(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim() || val.length < 2) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      if (!user) return
      setSearching(true)
      try {
        const data = await searchUsers(val.trim(), user.id)
        setResults(data)
      } catch { setResults([]) }
      setSearching(false)
    }, 400)
  }

  async function handleFollow(targetId: string) {
    try {
      await followUser(targetId)
      setResults((prev) => prev.map((r) =>
        r.id === targetId ? { ...r, is_following: true, followers_count: r.followers_count + 1 } : r
      ))
      toast('Siguiendo')
      if (user) getSocialFeed(user.id).then(setFeed).catch(() => {})
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

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Feed</h1>

      {/* Buscador de personas */}
      <div className="relative max-w-md mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar personas por nombre o username..."
          className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
        />

        {(results.length > 0 || searching) && query.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg z-20 max-h-80 overflow-y-auto">
            {searching && (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!searching && results.map((person) => (
              <div key={person.id} className="flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors first:rounded-t-xl last:rounded-b-xl">
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  onClick={() => { setQuery(''); setResults([]); navigate(`/u/${person.username}`) }}
                >
                  {person.avatar_url ? (
                    <img src={person.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white shrink-0">
                      {person.name?.charAt(0) ?? '?'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{person.name}</p>
                    <p className="text-xs text-text-muted">@{person.username}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); person.is_following ? handleUnfollow(person.id) : handleFollow(person.id) }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                    person.is_following
                      ? 'bg-bg border border-border text-text-muted hover:text-error hover:border-error'
                      : 'bg-primary hover:bg-primary-hover text-white'
                  }`}
                >
                  {person.is_following ? <><UserMinus size={14} /> Siguiendo</> : <><UserPlus size={14} /> Seguir</>}
                </button>
              </div>
            ))}
            {!searching && results.length === 0 && query.length >= 2 && (
              <p className="text-sm text-text-muted text-center py-4">Sin resultados</p>
            )}
          </div>
        )}
      </div>

      {/* Feed */}
      {feed.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl">
          <EmptyState
            icon={Rss}
            title="Tu feed está vacío"
            description="Busca personas arriba y síguelas para ver su actividad aquí"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {feed.map((item) => {
            const { icon: Icon, color, textColor } = ICON_MAP[item.item_type]
            return (
              <div key={`${item.item_type}-${item.item_id}`}
                className="bg-surface border border-border rounded-xl px-5 py-4 hover:bg-surface-hover transition-colors">
                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center gap-2 cursor-pointer shrink-0"
                    onClick={() => navigate(`/u/${item.username}`)}
                  >
                    {item.avatar_url ? (
                      <img src={item.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white">
                        {item.username?.charAt(0) ?? '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium cursor-pointer hover:underline"
                        onClick={() => navigate(`/u/${item.username}`)}>
                        @{item.username}
                      </span>
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${color}`}>
                        <Icon size={12} className={textColor} />
                      </div>
                      <span className="text-xs text-text-muted">{item.created_date}</span>
                    </div>
                    <p className="text-sm">{item.title}</p>
                    <p className="text-xs text-text-muted">{item.subtitle}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
