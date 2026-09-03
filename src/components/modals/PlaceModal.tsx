import { useState, useEffect } from 'react'
import { X, Star } from 'lucide-react'
import type { Place } from '../../types'
import ImageUploader from '../ui/ImageUploader'

interface PlaceModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Place, 'id' | 'user_id'> & { user_id?: string }) => void
  initial?: Place | null
}

export default function PlaceModal({ open, onClose, onSave, initial }: PlaceModalProps) {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [visitedAt, setVisitedAt] = useState('')
  const [driveImage, setDriveImage] = useState<string | null>(null)

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setCity(initial.city)
      setCountry(initial.country)
      setRating(initial.rating)
      setVisitedAt(initial.visited_at ?? '')
      setDriveImage(initial.drive_image)
    } else {
      setName('')
      setCity('')
      setCountry('')
      setRating(null)
      setVisitedAt('')
      setDriveImage(null)
    }
  }, [initial, open])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      name: name.trim(),
      city: city.trim(),
      country: country.trim(),
      rating,
      visited_at: visitedAt || null,
      drive_image: driveImage,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{initial ? 'Editar' : 'Nuevo'} lugar</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder="Nombre del lugar" value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Ciudad" value={city} onChange={(e) => setCity(e.target.value)} required
              className="bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
            <input type="text" placeholder="País" value={country} onChange={(e) => setCountry(e.target.value)} required
              className="bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
          </div>
          <input type="date" value={visitedAt} onChange={(e) => setVisitedAt(e.target.value)}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary" />
          <ImageUploader value={driveImage} onChange={setDriveImage} />
          <div>
            <label className="text-xs text-text-muted mb-2 block">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(rating === n ? null : n)} className="p-0.5 transition-colors">
                  <Star size={24} className={n <= (rating ?? 0) ? 'text-warning fill-warning' : 'text-text-muted/30'} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <button type="submit" disabled={!name.trim() || !city.trim() || !country.trim()}
          className="w-full mt-6 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
          {initial ? 'Guardar cambios' : 'Registrar lugar'}
        </button>
      </form>
    </div>
  )
}
