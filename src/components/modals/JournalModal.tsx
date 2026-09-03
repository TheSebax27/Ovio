import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { JournalEntry } from '../../types'
import ImageUploader from '../ui/ImageUploader'

const MOODS = [
  { value: 1, emoji: '😞', label: 'Muy mal' },
  { value: 2, emoji: '😕', label: 'Mal' },
  { value: 3, emoji: '😐', label: 'Normal' },
  { value: 4, emoji: '😊', label: 'Bien' },
  { value: 5, emoji: '😄', label: 'Muy bien' },
]

interface JournalModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<JournalEntry, 'id' | 'user_id'> & { user_id?: string }) => void
  initial?: JournalEntry | null
}

export default function JournalModal({ open, onClose, onSave, initial }: JournalModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<number>(3)
  const [driveImage, setDriveImage] = useState<string | null>(null)

  useEffect(() => {
    if (initial) {
      setTitle(initial.title)
      setContent(initial.content)
      setMood(initial.mood ?? 3)
      setDriveImage(initial.drive_image)
    } else {
      setTitle('')
      setContent('')
      setMood(3)
      setDriveImage(null)
    }
  }, [initial, open])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      title: title.trim(),
      content,
      mood,
      drive_image: driveImage,
      created_at: initial?.created_at ?? new Date().toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{initial ? 'Editar' : 'Nueva'} entrada</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} required
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
          <textarea placeholder="¿Qué pasó hoy?" value={content} onChange={(e) => setContent(e.target.value)} required rows={6}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary resize-none" />
          <ImageUploader value={driveImage} onChange={setDriveImage} />
          <div>
            <label className="text-xs text-text-muted mb-2 block">¿Cómo te sientes?</label>
            <div className="flex gap-2 justify-center">
              {MOODS.map((m) => (
                <button key={m.value} type="button" onClick={() => setMood(m.value)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                    mood === m.value ? 'bg-primary/10 ring-2 ring-primary' : 'bg-bg hover:bg-surface-hover'
                  }`}>
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[10px] text-text-muted">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <button type="submit" disabled={!title.trim() || !content.trim()}
          className="w-full mt-6 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
          {initial ? 'Guardar cambios' : 'Guardar entrada'}
        </button>
      </form>
    </div>
  )
}
