import { useEffect, useState, useMemo } from 'react'
import { Plus, HandCoins, Trash2, Pencil, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getLoans, createLoan, updateLoan, deleteLoan, getLoanPayments, createLoanPayment } from '../../services/loanService'
import LoanModal from '../../components/modals/LoanModal'
import EmptyState from '../../components/ui/EmptyState'
import type { Loan, LoanPayment } from '../../types'

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}

export default function LoansTab() {
  const { user } = useAuth()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Loan | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [payments, setPayments] = useState<Record<string, LoanPayment[]>>({})
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'given' | 'received'>('all')

  useEffect(() => {
    if (!user) return
    getLoans(user.id).then((data) => { setLoans(data); setLoading(false) })
  }, [user])

  const filtered = useMemo(() =>
    loans.filter((l) => filterType === 'all' || l.type === filterType),
    [loans, filterType]
  )

  async function toggleExpand(loanId: string) {
    if (expandedId === loanId) { setExpandedId(null); return }
    if (!payments[loanId]) {
      const p = await getLoanPayments(loanId)
      setPayments((prev) => ({ ...prev, [loanId]: p }))
    }
    setExpandedId(loanId)
    setPaymentAmount('')
    setPaymentNote('')
  }

  async function handleSave(data: Omit<Loan, 'id' | 'user_id'>) {
    if (!user) return
    if (editing) {
      const updated = await updateLoan(editing.id, data)
      setLoans((prev) => prev.map((l) => l.id === editing.id ? updated : l))
    } else {
      const created = await createLoan({ ...data, user_id: user.id })
      setLoans((prev) => [created, ...prev])
    }
    setEditing(null)
    setModalOpen(false)
  }

  async function handleAddPayment(loanId: string) {
    if (!paymentAmount) return
    const payment = await createLoanPayment({
      loan_id: loanId,
      amount: parseFloat(paymentAmount),
      note: paymentNote.trim() || null,
      date: new Date().toISOString().split('T')[0],
    })
    setPayments((prev) => ({ ...prev, [loanId]: [payment, ...(prev[loanId] ?? [])] }))
    setPaymentAmount('')
    setPaymentNote('')
  }

  function getPaidAmount(loanId: string) {
    return (payments[loanId] ?? []).reduce((s, p) => s + Number(p.amount), 0)
  }

  async function handleMarkPaid(loan: Loan) {
    const updated = await updateLoan(loan.id, { status: 'paid' })
    setLoans((prev) => prev.map((l) => l.id === loan.id ? updated : l))
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-3">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary">
            <option value="all">Todos</option>
            <option value="given">Presté</option>
            <option value="received">Me prestaron</option>
          </select>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Plus size={18} /> Nuevo préstamo
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl">
          <EmptyState icon={HandCoins} title="Sin préstamos" description="Registra préstamos dados o recibidos y lleva el control de los pagos" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((loan) => {
            const paid = getPaidAmount(loan.id)
            const remaining = Number(loan.amount) - paid
            return (
              <div key={loan.id} className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-surface-hover transition-colors"
                  onClick={() => toggleExpand(loan.id)}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${loan.type === 'given' ? 'bg-warning/10' : 'bg-secondary/10'}`}>
                      <HandCoins size={18} className={loan.type === 'given' ? 'text-warning' : 'text-secondary'} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{loan.person}</p>
                      <p className="text-xs text-text-muted">
                        {loan.type === 'given' ? 'Presté' : 'Me prestaron'} · {loan.created_at}
                        {loan.status === 'paid' && <span className="ml-2 text-success">Pagado</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatMoney(Number(loan.amount))}</p>
                      {paid > 0 && loan.status === 'pending' && (
                        <p className="text-xs text-text-muted">Resta: {formatMoney(remaining)}</p>
                      )}
                    </div>
                    {expandedId === loan.id ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
                  </div>
                </div>
                {expandedId === loan.id && (
                  <div className="border-t border-border px-5 py-4 space-y-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditing(loan); setModalOpen(true) }}
                        className="flex items-center gap-1 text-xs text-text-muted hover:text-text px-2 py-1 rounded bg-bg"><Pencil size={14} /> Editar</button>
                      {loan.status === 'pending' && (
                        <button onClick={() => handleMarkPaid(loan)}
                          className="flex items-center gap-1 text-xs text-success hover:text-success/80 px-2 py-1 rounded bg-bg"><Check size={14} /> Marcar pagado</button>
                      )}
                      <button onClick={async () => { await deleteLoan(loan.id); setLoans((p) => p.filter((l) => l.id !== loan.id)); setExpandedId(null) }}
                        className="flex items-center gap-1 text-xs text-error hover:text-error/80 px-2 py-1 rounded bg-bg"><Trash2 size={14} /> Eliminar</button>
                    </div>
                    {loan.status === 'pending' && (
                      <div className="flex gap-2">
                        <input type="number" placeholder="Abono" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} min="0" step="0.01"
                          className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
                        <input type="text" placeholder="Nota" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)}
                          className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
                        <button onClick={() => handleAddPayment(loan.id)} disabled={!paymentAmount}
                          className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Abonar</button>
                      </div>
                    )}
                    {(payments[loan.id] ?? []).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-text-muted font-medium">Historial de pagos</p>
                        {(payments[loan.id] ?? []).map((p) => (
                          <div key={p.id} className="flex justify-between text-sm bg-bg rounded-lg px-3 py-2">
                            <span>{p.date} {p.note && <span className="text-text-muted">— {p.note}</span>}</span>
                            <span className="text-success font-medium">{formatMoney(Number(p.amount))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <LoanModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={handleSave} initial={editing} />
    </div>
  )
}
