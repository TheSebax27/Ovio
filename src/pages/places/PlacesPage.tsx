import { useEffect, useState, useMemo } from 'react'
import { Plus, MapPin, Trash2, Pencil, Star, Globe } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getPlaces, createPlace, updatePlace, deletePlace } from '../../services/placeService'
import PlaceModal from '../../components/modals/PlaceModal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ExportButton from '../../components/ui/ExportButton'
import type { Place } from '../../types'

export default function PlacesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Place | null>(null)
  const [filterCountry, setFilterCountry] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getPlaces(user.id).then((data) => { setPlaces(data); setLoading(false) })
  }, [user])

  const countries = useMemo(() => [...new Set(places.map((p) => p.country))].sort(), [places])

  const filtered = useMemo(() =>
    places.filter((p) => filterCountry === 'all' || p.country === filterCountry),
    [places, filterCountry])

  async function handleSave(data: Omit<Place, 'id' | 'user_id'>) {
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
    setEditing(null)
    setModalOpen(false)
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

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Lugares</h1>
        <div className="flex gap-2">
          <ExportButton data={places.map((p) => ({ Nombre: p.name, Ciudad: p.city, País: p.country, Rating: p.rating ?? '', Fecha: p.visited_at ?? '' }))} fileName="lugares" />
          <button onClick={() => { setEditing(null); setModalOpen(true) }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus size={18} /> Nuevo lugar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-text-muted">Lugares</p>
            <MapPin size={20} className="text-primary" />
          </div>
          <p className="text-2xl font-bold">{places.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-text-muted">Países</p>
            <Globe size={20} className="text-secondary" />
          </div>
          <p className="text-2xl font-bold text-secondary">{countries.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-text-muted">Ciudades</p>
            <MapPin size={20} className="text-success" />
          </div>
          <p className="text-2xl font-bold text-success">{new Set(places.map((p) => p.city)).size}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary">
          <option value="all">Todos los países</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl">
          <EmptyState icon={MapPin} title="Sin lugares" description="Registra los lugares que has visitado y califícalos" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((place) => (
            <div key={place.id} className="bg-surface border border-border rounded-xl p-5 group hover:bg-surface-hover transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium mb-1">{place.name}</p>
                  <div className="flex items-center gap-1 text-xs text-text-muted mb-2">
                    <MapPin size={12} />
                    <span>{place.city}, {place.country}</span>
                  </div>
                  {place.rating && (
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={14} className={n <= place.rating! ? 'text-warning fill-warning' : 'text-text-muted/20'} />
                      ))}
                    </div>
                  )}
                  {place.visited_at && <p className="text-xs text-text-muted mt-2">{place.visited_at}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(place); setModalOpen(true) }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-bg transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteId(place.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <PlaceModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={handleSave} initial={editing} />
      <ConfirmDialog open={!!deleteId} title="Eliminar lugar" message="Este lugar se eliminará permanentemente." onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
