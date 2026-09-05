import { useEffect, useState, useMemo } from 'react'
import { Plus, MapPin, Trash2, Pencil, Star, Globe, Heart } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getPlaces, createPlace, updatePlace, deletePlace } from '../../services/placeService'
import { toggleLike, getUserLikes } from '../../services/likeService'
import PlaceModal from '../../components/modals/PlaceModal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ExportButton from '../../components/ui/ExportButton'
import type { Place } from '../../types'

export default function PlacesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [places, setPlaces] = useState<Place[]>([])
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Place | null>(null)
  const [filterCountry, setFilterCountry] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([getPlaces(user.id), getUserLikes('place')]).then(([data, likes]) => {
      setPlaces(data); setLikedIds(likes); setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  const countries = useMemo(() => [...new Set(places.map((p) => p.country))].sort(), [places])

  const filtered = useMemo(() =>
    places.filter((p) => filterCountry === 'all' || p.country === filterCountry),
    [places, filterCountry])

  async function handleSave(data: Omit<Place, 'id' | 'user_id' | 'likes_count'>) {
    if (!user) return
    try {
      if (editing) {
        const updated = await updatePlace(editing.id, data)
        setPlaces((prev) => prev.map((p) => p.id === editing.id ? updated : p))
        toast('Lugar actualizado')
      } else {
        const created = await createPlace({ ...data, user_id: user.id })
        setPlaces((prev) => [created, ...prev])
        toast('Lugar registrado')
      }
    } catch { toast('Error al guardar', 'error') }
    setEditing(null); setModalOpen(false)
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      await deletePlace(deleteId)
      setPlaces((p) => p.filter((pl) => pl.id !== deleteId))
      toast('Lugar eliminado')
    } catch { toast('Error al eliminar', 'error') }
    setDeleteId(null)
  }

  async function handleLike(placeId: string) {
    try {
      const liked = await toggleLike('place', placeId)
      setLikedIds((prev) => {
        const next = new Set(prev)
        liked ? next.add(placeId) : next.delete(placeId)
        return next
      })
      setPlaces((prev) => prev.map((p) =>
        p.id === placeId ? { ...p, likes_count: p.likes_count + (liked ? 1 : -1) } : p
      ))
    } catch { toast('Error', 'error') }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Lugares</h1>
          <p className="text-sm text-text-muted">Todos los lugares que has visitado</p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={places.map((p) => ({ Nombre: p.name, Ciudad: p.city, País: p.country, Rating: p.rating ?? '', Fecha: p.visited_at ?? '', Likes: p.likes_count ?? 0 }))} fileName="lugares" />
          <button onClick={() => { setEditing(null); setModalOpen(true) }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus size={18} /> Nuevo lugar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><MapPin size={22} className="text-primary" /></div>
          <div>
            <p className="text-xs text-text-muted">Total de lugares</p>
            <p className="text-2xl font-bold">{places.length}</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center"><Globe size={22} className="text-secondary" /></div>
          <div>
            <p className="text-xs text-text-muted">Países</p>
            <p className="text-2xl font-bold">{countries.length}</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center"><MapPin size={22} className="text-success" /></div>
          <div>
            <p className="text-xs text-text-muted">Ciudades</p>
            <p className="text-2xl font-bold">{new Set(places.map((p) => p.city)).size}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilterCountry('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            filterCountry === 'all' ? 'bg-primary text-white' : 'bg-surface border border-border text-text-muted hover:text-text'
          }`}>Todos</button>
        {countries.map((c) => (
          <button key={c} onClick={() => setFilterCountry(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterCountry === c ? 'bg-primary text-white' : 'bg-surface border border-border text-text-muted hover:text-text'
            }`}>{c}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl">
          <EmptyState icon={MapPin} title="Sin lugares" description="Registra los lugares que has visitado y califícalos" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((place) => {
            const isLiked = likedIds.has(place.id)
            return (
              <div key={place.id} className="bg-surface border border-border rounded-2xl overflow-hidden group hover:border-primary/30 transition-colors">
                <div className="relative h-44 bg-bg overflow-hidden">
                  {place.drive_image ? (
                    <img src={place.drive_image} alt={place.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-success/20 to-primary/20 flex items-center justify-center">
                      <MapPin size={40} className="text-text-muted/30" />
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-lg">
                    {place.country}
                  </span>
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button onClick={() => { setEditing(place); setModalOpen(true) }}
                      className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteId(place.id)}
                      className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-error/80 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold">{place.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
                    <MapPin size={11} />
                    <span>{place.city}, {place.country}</span>
                  </div>
                  {place.rating && (
                    <div className="flex gap-0.5 mt-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={13} className={n <= place.rating! ? 'text-warning fill-warning' : 'text-text-muted/20'} />
                      ))}
                    </div>
                  )}
                  {place.visited_at && (
                    <p className="text-[11px] text-text-muted mt-1">{new Date(place.visited_at + 'T12:00:00').toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <button onClick={() => handleLike(place.id)}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${isLiked ? 'text-error' : 'text-text-muted hover:text-error'}`}>
                      <Heart size={16} className={isLiked ? 'fill-error' : ''} />
                      <span className="text-xs font-medium">{place.likes_count ?? 0}</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <PlaceModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={handleSave} initial={editing} />
      <ConfirmDialog open={!!deleteId} title="Eliminar lugar" message="Este lugar se eliminará permanentemente." onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
