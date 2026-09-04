import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Task } from '../../types'

interface TaskModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Task, 'id' | 'user_id' | 'created_at' | 'gcal_event_id'> & { user_id?: string }) => void
  initial?: Task | null
  defaultDate?: string
}

const PRIORITIES = [
  { value: 'low', label: 'Baja', color: 'bg-success/20 text-success' },
  { value: 'medium', label: 'Media', color: 'bg-warning/20 text-warning' },
  { value: 'high', label: 'Alta', color: 'bg-error/20 text-error' },
] as const

export default function TaskModal({ open, onClose, onSave, initial, defaultDate }: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')

  useEffect(() => {
    if (initial) {
      setTitle(initial.title)
      setDescription(initial.description)
      setDate(initial.date)
      setTime(initial.time ?? '')
      setPriority(initial.priority)
    } else {
      setTitle('')
      setDescription('')
      setDate(defaultDate ?? new Date().toISOString().split('T')[0])
      setTime('')
      setPriority('medium')
    }
  }, [initial, open, defaultDate])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      title: title.trim(),
      description: description.trim(),
      date,
      time: time || null,
      priority,
      completed: initial?.completed ?? false,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{initial ? 'Editar' : 'Nueva'} tarea</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder="¿Qué necesitas hacer?" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
          <textarea placeholder="Descripción (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
              className="bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-2 block">Prioridad</label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button key={p.value} type="button" onClick={() => setPriority(p.value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    priority === p.value ? p.color + ' ring-2 ring-current' : 'bg-bg text-text-muted'
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button type="submit" disabled={!title.trim() || !date}
          className="w-full mt-6 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
          {initial ? 'Guardar cambios' : 'Crear tarea'}
        </button>
      </form>
    </div>
  )
}
