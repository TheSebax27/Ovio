import { useEffect, useState, useMemo } from 'react'
import { Plus, Film, Tv, Trash2, Pencil, Star } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getMovies, createMovie, updateMovie, deleteMovie } from '../../services/movieService'
import MovieModal from '../../components/modals/MovieModal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ExportButton from '../../components/ui/ExportButton'
import type { Movie } from '../../types'

const STATUS_LABEL: Record<string, string> = { planned: 'Por ver', watching: 'Viendo', completed: 'Vista' }
const STATUS_COLOR: Record<string, string> = { planned: 'bg-text-muted/20 text-text-muted', watching: 'bg-primary/20 text-primary', completed: 'bg-success/20 text-success' }

export default function EntertainmentPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Movie | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'series'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'planned' | 'watching' | 'completed'>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getMovies(user.id).then((data) => { setMovies(data); setLoading(false) })
  }, [user])

  const filtered = useMemo(() =>
    movies.filter((m) => {
      if (filterType !== 'all' && m.media_type !== filterType) return false
      if (filterStatus !== 'all' && m.status !== filterStatus) return false
      return true
    }), [movies, filterType, filterStatus])

  const stats = useMemo(() => ({
    total: movies.length,
    movies: movies.filter((m) => m.media_type === 'movie').length,
    series: movies.filter((m) => m.media_type === 'series').length,
    completed: movies.filter((m) => m.status === 'completed').length,
  }), [movies])

  async function handleSave(data: Omit<Movie, 'id' | 'user_id'>) {
    if (!user) return
    try {
      if (editing) {
        const updated = await updateMovie(editing.id, data)
        setMovies((prev) => prev.map((m) => m.id === editing.id ? updated : m))
        toast('Título actualizado')
      } else {
        const created = await createMovie({ ...data, user_id: user.id })
        setMovies((prev) => [created, ...prev])
        toast('Título agregado')
      }
    } catch { toast('Error al guardar', 'error') }
    setEditing(null)
    setModalOpen(false)
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      await deleteMovie(deleteId)
      setMovies((p) => p.filter((m) => m.id !== deleteId))
      toast('Título eliminado')
    } catch { toast('Error al eliminar', 'error') }
    setDeleteId(null)
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Entretenimiento</h1>
        <div className="flex gap-2">
          <ExportButton data={movies.map((m) => ({ Título: m.title, Tipo: m.media_type === 'movie' ? 'Película' : 'Serie', Estado: m.status, Rating: m.rating ?? '', Fecha: m.watched_at ?? '' }))} fileName="entretenimiento" />
          <button onClick={() => { setEditing(null); setModalOpen(true) }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus size={18} /> Agregar título
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-text-muted">Total</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{stats.movies}</p>
          <p className="text-xs text-text-muted">Películas</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-secondary">{stats.series}</p>
          <p className="text-xs text-text-muted">Series</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-success">{stats.completed}</p>
          <p className="text-xs text-text-muted">Vistas</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as typeof filterType)}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary">
          <option value="all">Todos</option>
          <option value="movie">Películas</option>
          <option value="series">Series</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary">
          <option value="all">Todos los estados</option>
          <option value="planned">Por ver</option>
          <option value="watching">Viendo</option>
          <option value="completed">Vistas</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl">
          <EmptyState icon={Film} title="Sin títulos" description="Agrega las películas y series que has visto o quieres ver" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((movie) => (
            <div key={movie.id} className="bg-surface border border-border rounded-xl overflow-hidden group">
              {movie.poster_url && (
                <img src={movie.poster_url} alt={movie.title} className="w-full h-48 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {movie.media_type === 'movie' ? <Film size={14} className="text-primary" /> : <Tv size={14} className="text-secondary" />}
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[movie.status]}`}>
                        {STATUS_LABEL[movie.status]}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{movie.title}</p>
                    {movie.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={12} className="text-warning fill-warning" />
                        <span className="text-xs text-text-muted">{movie.rating}/10</span>
                      </div>
                    )}
                    {movie.watched_at && <p className="text-xs text-text-muted mt-1">{movie.watched_at}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(movie); setModalOpen(true) }}
                      className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-bg transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteId(movie.id)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <MovieModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={handleSave} initial={editing} />
      <ConfirmDialog open={!!deleteId} title="Eliminar título" message="Este título se eliminará permanentemente de tu colección." onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
