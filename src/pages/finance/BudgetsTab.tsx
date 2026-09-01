import { useEffect, useState, useMemo } from 'react'
import { Plus, Gauge, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getBudgets, upsertBudget, deleteBudget } from '../../services/budgetService'
import { getFinances } from '../../services/financeService'
import BudgetModal from '../../components/modals/BudgetModal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import type { Budget, Finance } from '../../types'

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function BudgetsTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [expenses, setExpenses] = useState<Finance[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      getBudgets(user.id, month, year),
      getFinances(user.id),
    ]).then(([b, f]) => {
      setBudgets(b)
      setExpenses(f)
      setLoading(false)
    })
  }, [user, month, year])

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    const monthStr = `${year}-${String(month).padStart(2, '0')}`
    for (const e of expenses) {
      if (e.type === 'expense' && e.date.startsWith(monthStr)) {
        map[e.category] = (map[e.category] ?? 0) + Number(e.amount)
      }
    }
    return map
  }, [expenses, month, year])

  async function handleSave(category: string, limitAmount: number) {
    if (!user) return
    try {
      const budget = await upsertBudget({ user_id: user.id, category, limit_amount: limitAmount, month, year })
      setBudgets((prev) => [...prev.filter((b) => b.category !== category), budget])
      toast('Presupuesto guardado')
    } catch { toast('Error al guardar', 'error') }
    setModalOpen(false)
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      await deleteBudget(deleteId)
      setBudgets((p) => p.filter((x) => x.id !== deleteId))
      toast('Presupuesto eliminado')
    } catch { toast('Error al eliminar', 'error') }
    setDeleteId(null)
  }

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
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Plus size={18} /> Nuevo presupuesto
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl">
          <EmptyState icon={Gauge} title="Sin presupuestos" description="Define límites de gasto por categoría para controlar tus finanzas" />
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => {
            const spent = spentByCategory[b.category] ?? 0
            const pct = Math.min(100, (spent / Number(b.limit_amount)) * 100)
            const over = spent > Number(b.limit_amount)
            return (
              <div key={b.id} className="bg-surface border border-border rounded-xl px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{b.category}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-sm">
                      <span className={over ? 'text-error font-semibold' : 'text-text'}>{formatMoney(spent)}</span>
                      <span className="text-text-muted"> / {formatMoney(Number(b.limit_amount))}</span>
                    </p>
                    <button onClick={() => setDeleteId(b.id)}
                      className="p-1 rounded text-text-muted hover:text-error transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="w-full bg-bg rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${over ? 'bg-error' : pct > 75 ? 'bg-warning' : 'bg-success'}`}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
      <BudgetModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} existingCategories={budgets.map((b) => b.category)} />
      <ConfirmDialog open={!!deleteId} title="Eliminar presupuesto" message="Este presupuesto se eliminará permanentemente." onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
