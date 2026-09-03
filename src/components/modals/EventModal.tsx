import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Event } from '../../types'
import ImageUploader from '../ui/ImageUploader'

interface EventModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Event, 'id' | 'user_id'> & { user_id?: string }) => void
  initial?: Event | null
}

export default function EventModal({ open, onClose, onSave, initial }: EventModalProps) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'concert' | 'match'>('concert')
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
        <div className="flex gap-2 mb-4">
          <button type="button" onClick={() => setType('concert')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'concert' ? 'bg-secondary/20 text-secondary' : 'bg-bg text-text-muted'}`}>
            Concierto
          </button>
          <button type="button" onClick={() => setType('match')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'match' ? 'bg-success/20 text-success' : 'bg-bg text-text-muted'}`}>
            Partido
          </button>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder={type === 'concert' ? 'Artista o evento' : 'Equipos o evento'} value={title} onChange={(e) => setTitle(e.target.value)} required
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
