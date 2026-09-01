import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { FixedExpense } from '../../types'

const CATEGORIES = ['Arriendo', 'Servicios', 'Internet', 'Celular', 'Streaming', 'Seguro', 'Crédito', 'Tarjeta', 'Transporte', 'Otro']

interface FixedExpenseModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<FixedExpense, 'id' | 'user_id'> & { user_id?: string }) => void
  initial?: FixedExpense | null
}

export default function FixedExpenseModal({ open, onClose, onSave, initial }: FixedExpenseModalProps) {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Otro')
  const [dueDay, setDueDay] = useState('1')

  useEffect(() => {
    if (initial) {
      setTitle(initial.title)
      setAmount(String(initial.amount))
      setCategory(initial.category)
      setDueDay(String(initial.due_day))
    } else {
      setTitle('')
      setAmount('')
      setCategory('Otro')
      setDueDay('1')
    }
  }, [initial, open])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      title: title.trim(),
      amount: parseFloat(amount),
      category,
      due_day: parseInt(dueDay),
      is_active: true,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{initial ? 'Editar' : 'Nueva'} deuda fija</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder="Título (ej: Netflix, Arriendo)" value={title} onChange={(e) => setTitle(e.target.value)} required
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
          <input type="number" placeholder="Monto mensual" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0" step="0.01"
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div>
            <label className="text-xs text-text-muted mb-1 block">Día de pago</label>
            <input type="number" value={dueDay} onChange={(e) => setDueDay(e.target.value)} min="1" max="31"
              className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary" />
          </div>
        </div>
        <button type="submit" disabled={!title.trim() || !amount}
          className="w-full mt-6 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
          {initial ? 'Guardar cambios' : 'Registrar'}
        </button>
      </form>
    </div>
  )
}
