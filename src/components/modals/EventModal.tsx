import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Event, EventType } from '../../types'
import ImageUploader from '../ui/ImageUploader'

const EVENT_TYPES: { value: EventType; label: string; color: string }[] = [
  { value: 'concert', label: 'Concierto', color: 'bg-secondary/20 text-secondary' },
  { value: 'festival', label: 'Festival', color: 'bg-primary/20 text-primary' },
  { value: 'match', label: 'Partido', color: 'bg-success/20 text-success' },
  { value: 'sports', label: 'Deportes', color: 'bg-success/20 text-success' },
  { value: 'gastro', label: 'Gastronomía', color: 'bg-warning/20 text-warning' },
  { value: 'tech', label: 'Tecnología', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'art', label: 'Arte', color: 'bg-pink-500/20 text-pink-400' },
  { value: 'theater', label: 'Teatro', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'networking', label: 'Networking', color: 'bg-cyan-500/20 text-cyan-400' },
  { value: 'other', label: 'Otro', color: 'bg-text-muted/20 text-text-muted' },
]

interface EventModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Event, 'id' | 'user_id' | 'likes_count'> & { user_id?: string }) => void
  initial?: Event | null
}

export default function EventModal({ open, onClose, onSave, initial }: EventModalProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<EventType>('concert')
  const [city, setCity] = useState('')
  const [venue, setVenue] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [notes, setNotes] = useState('')
  const [driveCover, setDriveCover] = useState<string | null>(null)

  useEffect(() => {
    if (initial) {
      setTitle(initial.title)
      setType(initial.type)
      setCity(initial.city)
      setVenue(initial.venue)
      setEventDate(initial.event_date)
      setNotes(initial.notes ?? '')
      setDriveCover(initial.drive_cover)
    } else {
      setTitle('')
      setType('concert')
      setCity('')
      setVenue('')
      setEventDate('')
      setNotes('')
      setDriveCover(null)
    }
  }, [initial, open])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      title: title.trim(),
      type,
      city: city.trim(),
      venue: venue.trim(),
      event_date: eventDate,
      drive_cover: driveCover,
      notes: notes.trim() || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{initial ? 'Editar' : 'Nuevo'} evento</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-text-muted mb-2 block">Tipo</label>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => setType(t.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    type === t.value ? t.color + ' ring-1 ring-current' : 'bg-bg text-text-muted hover:text-text'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <input type="text" placeholder="Nombre del evento" value={title} onChange={(e) => setTitle(e.target.value)} required
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Ciudad" value={city} onChange={(e) => setCity(e.target.value)} required
              className="bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
            <input type="text" placeholder="Lugar / Estadio" value={venue} onChange={(e) => setVenue(e.target.value)} required
              className="bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
          </div>
          <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary" />
          <ImageUploader value={driveCover} onChange={setDriveCover} />
          <textarea placeholder="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary resize-none" />
        </div>
        <button type="submit" disabled={!title.trim() || !city.trim() || !venue.trim() || !eventDate}
          className="w-full mt-6 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
          {initial ? 'Guardar cambios' : 'Registrar evento'}
        </button>
      </form>
    </div>
  )
}
