import { useState } from 'react'
import { X } from 'lucide-react'

const CATEGORIES = [
  'Alimentación', 'Transporte', 'Entretenimiento', 'Salud',
  'Educación', 'Hogar', 'Ropa', 'Tecnología', 'Otro',
]

interface BudgetModalProps {
  open: boolean
  onClose: () => void
  onSave: (category: string, limitAmount: number) => void
  existingCategories: string[]
}

export default function BudgetModal({ open, onClose, onSave, existingCategories }: BudgetModalProps) {
  const [category, setCategory] = useState('')
  const [limitAmount, setLimitAmount] = useState('')

  const available = CATEGORIES.filter((c) => !existingCategories.includes(c))

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(category, parseFloat(limitAmount))
    setCategory('')
    setLimitAmount('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Nuevo presupuesto</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <select value={category} onChange={(e) => setCategory(e.target.value)} required
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary">
            <option value="">Seleccionar categoría</option>
            {available.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" placeholder="Límite mensual" value={limitAmount} onChange={(e) => setLimitAmount(e.target.value)} required min="0" step="0.01"
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
        </div>
        <button type="submit" disabled={!category || !limitAmount}
          className="w-full mt-6 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
          Crear presupuesto
        </button>
      </form>
    </div>
  )
}
