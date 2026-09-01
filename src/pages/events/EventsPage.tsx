import { useEffect, useState, useMemo } from 'react'
import { Plus, CalendarDays, Music, Trophy, Trash2, Pencil, MapPin } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getEvents, createEvent, updateEvent, deleteEvent } from '../../services/eventService'
import EventModal from '../../components/modals/EventModal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ExportButton from '../../components/ui/ExportButton'
import type { Event } from '../../types'

export default function EventsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Event | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'concert' | 'match'>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getEvents(user.id).then((data) => { setEvents(data); setLoading(false) })
  }, [user])

  const filtered = useMemo(() =>
    events.filter((e) => filterType === 'all' || e.type === filterType),
    [events, filterType])

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return events.filter((e) => e.event_date >= today).length
  }, [events])

  async function handleSave(data: Omit<Event, 'id' | 'user_id'>) {
    if (!user) return
    try {
      if (editing) {
        const updated = await updateEvent(editing.id, data)
        setEvents((prev) => prev.map((e) => e.id === editing.id ? updated : e))
        toast('Evento actualizado')
      } else {
        const created = await createEvent({ ...data, user_id: user.id })
        setEvents((prev) => [created, ...prev])
        toast('Evento registrado')
      }
    } catch { toast('Error al guardar', 'error') }
    setEditing(null)
    setModalOpen(false)
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      await deleteEvent(deleteId)
      setEvents((p) => p.filter((e) => e.id !== deleteId))
      toast('Evento eliminado')
    } catch { toast('Error al eliminar', 'error') }
    setDeleteId(null)
  }

  function formatDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Eventos</h1>
        <div className="flex gap-2">
          <ExportButton data={events.map((e) => ({ Título: e.title, Tipo: e.type === 'concert' ? 'Concierto' : 'Partido', Fecha: e.event_date, Lugar: e.venue, Ciudad: e.city }))} fileName="eventos" />
          <button onClick={() => { setEditing(null); setModalOpen(true) }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus size={18} /> Nuevo evento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-sm text-text-muted mb-1">Total</p>
          <p className="text-2xl font-bold">{events.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-sm text-text-muted mb-1">Próximos</p>
          <p className="text-2xl font-bold text-primary">{upcoming}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-sm text-text-muted mb-1">Ciudades</p>
          <p className="text-2xl font-bold text-secondary">{new Set(events.map((e) => e.city)).size}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as typeof filterType)}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary">
          <option value="all">Todos</option>
          <option value="concert">Conciertos</option>
          <option value="match">Partidos</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl">
          <EmptyState icon={CalendarDays} title="Sin eventos" description="Registra los conciertos y partidos a los que has ido o vas a ir" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((event) => {
            const isPast = event.event_date < new Date().toISOString().split('T')[0]
            return (
              <div key={event.id} className={`bg-surface border border-border rounded-xl px-5 py-4 hover:bg-surface-hover transition-colors ${isPast ? 'opacity-75' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${event.type === 'concert' ? 'bg-secondary/10' : 'bg-success/10'}`}>
                      {event.type === 'concert' ? <Music size={18} className="text-secondary" /> : <Trophy size={18} className="text-success" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span>{formatDate(event.event_date)}</span>
                        <span>·</span>
                        <MapPin size={12} />
                        <span>{event.venue}, {event.city}</span>
                      </div>
                      {event.notes && <p className="text-xs text-text-muted mt-1">{event.notes}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(event); setModalOpen(true) }}
                      className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-bg transition-colors"><Pencil size={16} /></button>
                    <button onClick={() => setDeleteId(event.id)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <EventModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={handleSave} initial={editing} />
      <ConfirmDialog open={!!deleteId} title="Eliminar evento" message="Este evento se eliminará permanentemente." onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
