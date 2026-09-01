import { useState, useEffect, useRef } from 'react'
import { X, Star, Search } from 'lucide-react'
import type { Movie } from '../../types'
import { searchTmdb, posterUrl as tmdbPoster, type TmdbResult } from '../../services/tmdbService'

interface MovieModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Movie, 'id' | 'user_id'> & { user_id?: string }) => void
  initial?: Movie | null
}

export default function MovieModal({ open, onClose, onSave, initial }: MovieModalProps) {
  const [title, setTitle] = useState('')
  const [mediaType, setMediaType] = useState<'movie' | 'series'>('movie')
  const [status, setStatus] = useState<'planned' | 'watching' | 'completed'>('planned')
  const [rating, setRating] = useState<number | null>(null)
  const [poster, setPoster] = useState('')
  const [watchedAt, setWatchedAt] = useState('')
  const [tmdbResults, setTmdbResults] = useState<TmdbResult[]>([])
  const [showTmdb, setShowTmdb] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    if (initial) {
      setTitle(initial.title)
      setMediaType(initial.media_type)
      setStatus(initial.status)
      setRating(initial.rating)
      setPoster(initial.poster_url ?? '')
      setWatchedAt(initial.watched_at ?? '')
    } else {
      setTitle('')
      setMediaType('movie')
      setStatus('planned')
      setRating(null)
      setPoster('')
      setWatchedAt('')
    }
    setTmdbResults([])
    setShowTmdb(false)
  }, [initial, open])

  function handleTitleChange(val: string) {
    setTitle(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim() || val.length < 2) { setTmdbResults([]); setShowTmdb(false); return }
    debounceRef.current = setTimeout(async () => {
      const results = await searchTmdb(val)
      setTmdbResults(results)
      setShowTmdb(results.length > 0)
    }, 400)
  }

  function selectTmdb(r: TmdbResult) {
    setTitle(r.title)
    setMediaType(r.media_type === 'tv' ? 'series' : 'movie')
    setPoster(tmdbPoster(r.poster_path) ?? '')
    setTmdbResults([])
    setShowTmdb(false)
  }

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      title: title.trim(),
      media_type: mediaType,
      status,
      rating,
      poster_url: poster.trim() || null,
      watched_at: watchedAt || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{initial ? 'Editar' : 'Agregar'} título</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text"><X size={20} /></button>
        </div>
        <div className="flex gap-2 mb-4">
          <button type="button" onClick={() => setMediaType('movie')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mediaType === 'movie' ? 'bg-primary/20 text-primary' : 'bg-bg text-text-muted'}`}>
            Película
          </button>
          <button type="button" onClick={() => setMediaType('series')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mediaType === 'series' ? 'bg-secondary/20 text-secondary' : 'bg-bg text-text-muted'}`}>
            Serie
          </button>
        </div>
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="text" placeholder="Buscar título..." value={title} onChange={(e) => handleTitleChange(e.target.value)} required
              onFocus={() => tmdbResults.length > 0 && setShowTmdb(true)}
              className="w-full bg-bg border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
            {showTmdb && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto z-10">
                {tmdbResults.map((r) => (
                  <button key={`${r.media_type}-${r.id}`} type="button" onClick={() => selectTmdb(r)}
                    className="w-full text-left px-3 py-2 hover:bg-surface-hover transition-colors flex items-center gap-3 border-b border-border last:border-0">
                    {r.poster_path ? (
                      <img src={tmdbPoster(r.poster_path)} alt="" className="w-8 h-12 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-12 rounded bg-bg shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-text-muted">{r.media_type === 'tv' ? 'Serie' : 'Película'} · {r.release_date?.split('-')[0] ?? ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary">
            <option value="planned">Por ver</option>
            <option value="watching">Viendo</option>
            <option value="completed">Vista</option>
          </select>
          {poster && (
            <div className="flex items-center gap-3">
              <img src={poster} alt="" className="w-12 h-18 rounded object-cover" />
              <button type="button" onClick={() => setPoster('')} className="text-xs text-text-muted hover:text-error">Quitar póster</button>
            </div>
          )}
          <input type="url" placeholder="URL del póster (opcional)" value={poster} onChange={(e) => setPoster(e.target.value)}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
          {status !== 'planned' && (
            <input type="date" value={watchedAt} onChange={(e) => setWatchedAt(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary" />
          )}
          <div>
            <label className="text-xs text-text-muted mb-2 block">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button key={n} type="button" onClick={() => setRating(rating === n ? null : n)}
                  className="p-0.5 transition-colors">
                  <Star size={20} className={n <= (rating ?? 0) ? 'text-warning fill-warning' : 'text-text-muted/30'} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <button type="submit" disabled={!title.trim()}
          className="w-full mt-6 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
          {initial ? 'Guardar cambios' : 'Agregar'}
        </button>
      </form>
    </div>
  )
}
