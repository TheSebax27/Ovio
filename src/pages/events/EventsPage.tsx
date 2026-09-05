import { useEffect, useState, useMemo } from 'react'
import { Plus, CalendarDays, Heart, MapPin, Pencil, Trash2, Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getEvents, createEvent, updateEvent, deleteEvent } from '../../services/eventService'
import { toggleLike, getUserLikes } from '../../services/likeService'
import EventModal from '../../components/modals/EventModal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ExportButton from '../../components/ui/ExportButton'
import type { Event, EventType } from '../../types'

const TYPE_LABELS: Record<EventType, { label: string; color: string }> = {
  concert: { label: 'Concierto', color: 'bg-secondary' },
  festival: { label: 'Festival', color: 'bg-primary' },
  match: { label: 'Partido', color: 'bg-success' },
  sports: { label: 'Deportes', color: 'bg-success' },
  gastro: { label: 'Gastronomía', color: 'bg-warning' },
  tech: { label: 'Tecnología', color: 'bg-blue-500' },
  art: { label: 'Arte', color: 'bg-pink-500' },
  theater: { label: 'Teatro', color: 'bg-purple-500' },
  networking: { label: 'Networking', color: 'bg-cyan-500' },
  other: { label: 'Otro', color: 'bg-text-muted' },
}

const MONTHS_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

export default function EventsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Event | null>(null)
  const [filterType, setFilterType] = useState<'all' | EventType>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([getEvents(user.id), getUserLikes('event')]).then(([data, likes]) => {
      setEvents(data); setLikedIds(likes); setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  const filtered = useMemo(() =>
    events.filter((e) => filterType === 'all' || e.type === filterType),
    [events, filterType])

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return events.filter((e) => e.event_date >= today).length
  }, [events])

  const cities = useMemo(() => new Set(events.map((e) => e.city)).size, [events])

  async function handleSave(data: Omit<Event, 'id' | 'user_id' | 'likes_count'>) {
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
    setEditing(null); setModalOpen(false)
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

  async function handleLike(eventId: string) {
    try {
      const liked = await toggleLike('event', eventId)
      setLikedIds((prev) => {
        const next = new Set(prev)
        liked ? next.add(eventId) : next.delete(eventId)
        return next
      })
      setEvents((prev) => prev.map((e) =>
        e.id === eventId ? { ...e, likes_count: e.likes_count + (liked ? 1 : -1) } : e
      ))
    } catch { toast('Error', 'error') }
  }

  function parseDate(d: string) {
    const [, m, day] = d.split('-')
    return { day: parseInt(day), month: MONTHS_SHORT[parseInt(m) - 1] }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Eventos</h1>
          <p className="text-sm text-text-muted">Descubre y gestiona todos tus eventos</p>
        </div>
        <div className="flex gap-2">
          <ExportButton data={events.map((e) => ({ Título: e.title, Tipo: TYPE_LABELS[e.type]?.label ?? e.type, Fecha: e.event_date, Lugar: e.venue, Ciudad: e.city, Likes: e.likes_count ?? 0 }))} fileName="eventos" />
          <button onClick={() => { setEditing(null); setModalOpen(true) }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus size={18} /> Nuevo evento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><CalendarDays size={22} className="text-primary" /></div>
          <div>
            <p className="text-xs text-text-muted">Total de eventos</p>
            <p className="text-2xl font-bold">{events.length}</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center"><Clock size={22} className="text-secondary" /></div>
          <div>
            <p className="text-xs text-text-muted">Próximos</p>
            <p className="text-2xl font-bold">{upcoming}</p>
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center"><MapPin size={22} className="text-success" /></div>
          <div>
            <p className="text-xs text-text-muted">Ciudades activas</p>
            <p className="text-2xl font-bold">{cities}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[{ value: 'all', label: 'Todos' }, ...Object.entries(TYPE_LABELS).map(([v, t]) => ({ value: v, label: t.label }))].map((f) => (
          <button key={f.value} onClick={() => setFilterType(f.value as typeof filterType)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterType === f.value ? 'bg-primary text-white' : 'bg-surface border border-border text-text-muted hover:text-text'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl">
          <EmptyState icon={CalendarDays} title="Sin eventos" description="Registra conciertos, partidos, festivales y más" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((event) => {
            const { day, month } = parseDate(event.event_date)
            const typeInfo = TYPE_LABELS[event.type] ?? TYPE_LABELS.other
            const isLiked = likedIds.has(event.id)
            return (
              <div key={event.id} className="bg-surface border border-border rounded-2xl overflow-hidden group hover:border-primary/30 transition-colors">
                <div className="relative h-44 bg-bg overflow-hidden">
                  {event.drive_cover ? (
                    <img src={event.drive_cover} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <CalendarDays size={40} className="text-text-muted/30" />
                    </div>
                  )}
                  <span className={`absolute top-3 left-3 ${typeInfo.color} text-white text-xs font-semibold px-2.5 py-1 rounded-lg`}>
                    {typeInfo.label}
                  </span>
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button onClick={() => { setEditing(event); setModalOpen(true) }}
                      className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteId(event.id)}
                      className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-error/80 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-center shrink-0 bg-bg rounded-xl px-3 py-2">
                      <p className="text-lg font-bold leading-none">{day}</p>
                      <p className="text-[10px] font-semibold text-primary">{month}</p>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate">{event.title}</h3>
                      <div className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
                        <MapPin size={11} />
                        <span className="truncate">{event.venue}, {event.city}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <button onClick={() => handleLike(event.id)}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${isLiked ? 'text-error' : 'text-text-muted hover:text-error'}`}>
                      <Heart size={16} className={isLiked ? 'fill-error' : ''} />
                      <span className="text-xs font-medium">{event.likes_count ?? 0}</span>
                    </button>
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
