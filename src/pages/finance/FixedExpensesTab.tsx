import { useEffect, useState } from 'react'
import { Plus, Receipt, Trash2, Pencil, Check, CircleDot } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getFixedExpenses, createFixedExpense, updateFixedExpense, deleteFixedExpense, getAllFixedPayments, markAsPaid } from '../../services/fixedExpenseService'
import FixedExpenseModal from '../../components/modals/FixedExpenseModal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import type { FixedExpense, FixedExpensePayment } from '../../types'

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function FixedExpensesTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [expenses, setExpenses] = useState<FixedExpense[]>([])
  const [payments, setPayments] = useState<FixedExpensePayment[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<FixedExpense | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      getFixedExpenses(user.id),
      getAllFixedPayments(user.id, month, year),
    ]).then(([e, p]) => { setExpenses(e); setPayments(p); setLoading(false) })
  }, [user, month, year])

  function isPaid(expenseId: string) {
    return payments.some((p) => p.fixed_expense_id === expenseId)
  }

  async function handleSave(data: Omit<FixedExpense, 'id' | 'user_id'>) {
    if (!user) return
    try {
      if (editing) {
        const updated = await updateFixedExpense(editing.id, data)
        setExpenses((prev) => prev.map((e) => e.id === editing.id ? updated : e))
        toast('Deuda fija actualizada')
      } else {
        const created = await createFixedExpense({ ...data, user_id: user.id })
        setExpenses((prev) => [...prev, created])
        toast('Deuda fija creada')
      }
    } catch { toast('Error al guardar', 'error') }
    setEditing(null)
    setModalOpen(false)
  }

  async function handleMarkPaid(expenseId: string) {
    try {
      const payment = await markAsPaid(expenseId, month, year)
      setPayments((prev) => [...prev, payment])
      toast('Marcada como pagada')
    } catch { toast('Error al marcar', 'error') }
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      await deleteFixedExpense(deleteId)
      setExpenses((p) => p.filter((e) => e.id !== deleteId))
      toast('Deuda fija eliminada')
    } catch { toast('Error al eliminar', 'error') }
    setDeleteId(null)
  }

  const totalMonthly = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const paidCount = expenses.filter((e) => isPaid(e.id)).length

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2 items-center">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary">
            {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Plus size={18} /> Nueva deuda fija
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-sm text-text-muted mb-1">Total mensual</p>
          <p className="text-2xl font-bold text-error">{formatMoney(totalMonthly)}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-sm text-text-muted mb-1">Pagadas este mes</p>
          <p className="text-2xl font-bold">{paidCount} <span className="text-text-muted text-base font-normal">/ {expenses.length}</span></p>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl">
          <EmptyState icon={Receipt} title="Sin deudas fijas" description="Registra tus pagos recurrentes como arriendo, servicios o suscripciones" />
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl divide-y divide-border">
          {expenses.map((expense) => {
            const paid = isPaid(expense.id)
            return (
              <div key={expense.id} className="flex items-center justify-between px-5 py-4 hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${paid ? 'bg-success/10' : 'bg-error/10'}`}>
                    {paid ? <Check size={18} className="text-success" /> : <CircleDot size={18} className="text-error" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${paid ? 'line-through text-text-muted' : ''}`}>{expense.title}</p>
                    <p className="text-xs text-text-muted">{expense.category} · Día {expense.due_day}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-error">{formatMoney(Number(expense.amount))}</span>
                  <div className="flex gap-1">
                    {!paid && (
                      <button onClick={() => handleMarkPaid(expense.id)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-success hover:bg-success/10 transition-colors" title="Marcar como pagada">
                        <Check size={16} />
                      </button>
                    )}
                    <button onClick={() => { setEditing(expense); setModalOpen(true) }}
                      className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-bg transition-colors"><Pencil size={16} /></button>
                    <button onClick={() => setDeleteId(expense.id)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <FixedExpenseModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={handleSave} initial={editing} />
      <ConfirmDialog open={!!deleteId} title="Eliminar deuda fija" message="Esta deuda fija se eliminará permanentemente." onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
