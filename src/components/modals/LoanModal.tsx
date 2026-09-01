import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Loan } from '../../types'

interface LoanModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Loan, 'id' | 'user_id'> & { user_id?: string }) => void
  initial?: Loan | null
}

export default function LoanModal({ open, onClose, onSave, initial }: LoanModalProps) {
  const [type, setType] = useState<'given' | 'received'>('given')
  const [person, setPerson] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (initial) {
      setType(initial.type)
      setPerson(initial.person)
      setAmount(String(initial.amount))
      setNote(initial.note ?? '')
      setDate(initial.created_at)
    } else {
      setType('given')
      setPerson('')
      setAmount('')
      setNote('')
      setDate(new Date().toISOString().split('T')[0])
    }
  }, [initial, open])

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      type,
      person: person.trim(),
      amount: parseFloat(amount),
      note: note.trim() || null,
      status: initial?.status ?? 'pending',
      created_at: date,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{initial ? 'Editar' : 'Nuevo'} préstamo</h2>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text"><X size={20} /></button>
        </div>
        <div className="flex gap-2 mb-4">
          <button type="button" onClick={() => setType('given')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'given' ? 'bg-warning/20 text-warning' : 'bg-bg text-text-muted'}`}>
            Presté
          </button>
          <button type="button" onClick={() => setType('received')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'received' ? 'bg-secondary/20 text-secondary' : 'bg-bg text-text-muted'}`}>
            Me prestaron
          </button>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder="Persona" value={person} onChange={(e) => setPerson(e.target.value)} required
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
          <input type="number" placeholder="Monto" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0" step="0.01"
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary" />
          <textarea placeholder="Nota (opcional)" value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary resize-none" />
        </div>
        <button type="submit" disabled={!person.trim() || !amount}
          className="w-full mt-6 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
          {initial ? 'Guardar cambios' : 'Registrar'}
        </button>
      </form>
    </div>
  )
}
