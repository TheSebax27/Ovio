import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Finance } from '../../types'

const CATEGORIES = [
  'Alimentación', 'Transporte', 'Entretenimiento', 'Salud',
  'Educación', 'Hogar', 'Ropa', 'Tecnología', 'Salario', 'Freelance', 'Otro',
]

interface FinanceModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Finance, 'id' | 'user_id'> & { user_id?: string }) => void
  initial?: Finance | null
}

export default function FinanceModal({ open, onClose, onSave, initial }: FinanceModalProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Otro')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (initial) {
      setType(initial.type)
      setTitle(initial.title)
      setAmount(String(initial.amount))
      setCategory(initial.category)
      setNote(initial.note ?? '')
      setDate(initial.date)
    } else {
      setType('expense')
      setTitle('')
      setAmount('')
      setCategory('Otro')
      setNote('')
      setDate(new Date().toISOString().split('T')[0])
    }
  }, [initial, open])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      type,
      title: title.trim(),
      amount: parseFloat(amount),
      category,
      note: note.trim() || null,
      date,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{initial ? 'Editar' : 'Nuevo'} registro</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              type === 'expense' ? 'bg-error/20 text-error' : 'bg-bg text-text-muted'
            }`}
          >
            Gasto
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              type === 'income' ? 'bg-success/20 text-success' : 'bg-bg text-text-muted'
            }`}
          >
            Ingreso
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
          />
          <input
            type="number"
            placeholder="Monto"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="0"
            step="0.01"
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary"
          />
          <textarea
            placeholder="Nota (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={!title.trim() || !amount}
          className="w-full mt-6 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {initial ? 'Guardar cambios' : 'Registrar'}
        </button>
      </form>
    </div>
  )
}
