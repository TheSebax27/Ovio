import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { SavingsGoal } from '../../types'

interface SavingsGoalModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<SavingsGoal, 'id' | 'user_id'> & { user_id?: string }) => void
  initial?: SavingsGoal | null
}

export default function SavingsGoalModal({ open, onClose, onSave, initial }: SavingsGoalModalProps) {
  const [title, setTitle] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')

  useEffect(() => {
    if (initial) {
      setTitle(initial.title)
      setTargetAmount(String(initial.target_amount))
      setDeadline(initial.deadline ?? '')
    } else {
      setTitle('')
      setTargetAmount('')
      setDeadline('')
    }
  }, [initial, open])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      title: title.trim(),
      target_amount: parseFloat(targetAmount),
      current_amount: initial?.current_amount ?? 0,
      deadline: deadline || null,
      status: initial?.status ?? 'active',
      created_at: initial?.created_at ?? new Date().toISOString().split('T')[0],
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{initial ? 'Editar' : 'Nueva'} meta de ahorro</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder="Título (ej: Viaje a Japón)" value={title} onChange={(e) => setTitle(e.target.value)} required
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
          <input type="number" placeholder="Monto objetivo" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required min="0" step="0.01"
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
          <div>
            <label className="text-xs text-text-muted mb-1 block">Fecha límite (opcional)</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary" />
          </div>
        </div>
        <button type="submit" disabled={!title.trim() || !targetAmount}
          className="w-full mt-6 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
          {initial ? 'Guardar cambios' : 'Crear meta'}
        </button>
      </form>
    </div>
  )
}
