import { useState, useRef, useEffect } from 'react'
import { Search, Menu, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

interface SearchResult {
  type: string
  title: string
  subtitle: string
  route: string
}

interface TopbarProps {
  onMenuToggle: () => void
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query.trim() || !user) { setResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      const q = query.toLowerCase()
      const items: SearchResult[] = []

      const [{ data: finances }, { data: movies }, { data: events }, { data: journal }, { data: places }] = await Promise.all([
        supabase.from('finances').select('id, title, category, type').eq('user_id', user.id).ilike('title', `%${q}%`).limit(5),
        supabase.from('movies').select('id, title, media_type, status').eq('user_id', user.id).ilike('title', `%${q}%`).limit(5),
        supabase.from('events').select('id, title, type, city').eq('user_id', user.id).ilike('title', `%${q}%`).limit(5),
        supabase.from('journal').select('id, title, created_at').eq('user_id', user.id).ilike('title', `%${q}%`).limit(5),
        supabase.from('places').select('id, name, city, country').eq('user_id', user.id).ilike('name', `%${q}%`).limit(5),
      ])

      finances?.forEach((f) => items.push({ type: 'Finanza', title: f.title, subtitle: `${f.type === 'income' ? 'Ingreso' : 'Gasto'} · ${f.category}`, route: '/finance' }))
      movies?.forEach((m) => items.push({ type: 'Película', title: m.title, subtitle: `${m.media_type === 'movie' ? 'Película' : 'Serie'} · ${m.status}`, route: '/entertainment' }))
      events?.forEach((e) => items.push({ type: 'Evento', title: e.title, subtitle: `${e.type === 'concert' ? 'Concierto' : 'Partido'} · ${e.city}`, route: '/events' }))
      journal?.forEach((j) => items.push({ type: 'Diario', title: j.title, subtitle: j.created_at.split('T')[0], route: '/journal' }))
      places?.forEach((p) => items.push({ type: 'Lugar', title: p.name, subtitle: `${p.city}, ${p.country}`, route: '/places' }))

      setResults(items)
      setShowResults(true)
    }, 300)
  }, [query, user])

  function handleSelect(result: SearchResult) {
    navigate(result.route)
    setQuery('')
    setShowResults(false)
  }

  return (
    <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="lg:hidden text-text-muted hover:text-text">
          <Menu size={22} />
        </button>
        <div className="relative w-48 sm:w-72" ref={searchRef}>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            className="w-full bg-bg border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); setShowResults(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
              <X size={14} />
            </button>
          )}
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg overflow-hidden max-h-80 overflow-y-auto">
              {results.map((r, i) => (
                <button key={i} onClick={() => handleSelect(r)}
                  className="w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors border-b border-border last:border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-text-muted">{r.subtitle}</p>
                    </div>
                    <span className="text-[10px] bg-bg px-2 py-0.5 rounded-full text-text-muted">{r.type}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {showResults && query.trim() && results.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg px-4 py-3">
              <p className="text-sm text-text-muted text-center">Sin resultados</p>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {profile && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted hidden sm:inline">@{profile.username}</span>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-medium text-white">
                {profile.name?.charAt(0) ?? '?'}
              </div>
            )}
            <button onClick={signOut} className="text-sm text-text-muted hover:text-text transition-colors">Salir</button>
          </div>
        )}
      </div>
    </header>
  )
}
