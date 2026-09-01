import { useEffect, useState, useMemo } from 'react'
import { Plus, Wallet, TrendingUp, TrendingDown, Trash2, Pencil } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getFinances, createFinance, updateFinance, deleteFinance } from '../../services/financeService'
import FinanceModal from '../../components/modals/FinanceModal'
import EmptyState from '../../components/ui/EmptyState'
import type { Finance } from '../../types'

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}

export default function FinanceTransactionsTab() {
  const { user } = useAuth()
  const [records, setRecords] = useState<Finance[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Finance | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterCategory, setFilterCategory] = useState('all')

  useEffect(() => {
    if (!user) return
    getFinances(user.id).then((data) => { setRecords(data); setLoading(false) })
  }, [user])

  const filtered = useMemo(() =>
    records.filter((r) => {
      if (filterType !== 'all' && r.type !== filterType) return false
      if (filterCategory !== 'all' && r.category !== filterCategory) return false
      return true
    }), [records, filterType, filterCategory])

  const totalIncome = useMemo(() => records.filter((r) => r.type === 'income').reduce((s, r) => s + Number(r.amount), 0), [records])
  const totalExpense = useMemo(() => records.filter((r) => r.type === 'expense').reduce((s, r) => s + Number(r.amount), 0), [records])
  const balance = totalIncome - totalExpense
  const categories = useMemo(() => [...new Set(records.map((r) => r.category))], [records])

  async function handleSave(data: Omit<Finance, 'id' | 'user_id'>) {
    if (!user) return
    if (editing) {
      const updated = await updateFinance(editing.id, data)
      setRecords((prev) => prev.map((r) => r.id === editing.id ? updated : r))
    } else {
      const created = await createFinance({ ...data, user_id: user.id })
      setRecords((prev) => [created, ...prev])
    }
    setEditing(null)
    setModalOpen(false)
  }

  async function handleDelete(id: string) {
    await deleteFinance(id)
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-3">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary">
            <option value="all">Todos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary">
            <option value="all">Todas las categorías</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Plus size={18} /> Nuevo registro
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">Balance</span>
            <Wallet size={20} className="text-primary" />
          </div>
          <span className={`text-2xl font-bold ${balance >= 0 ? 'text-success' : 'text-error'}`}>{formatMoney(balance)}</span>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">Ingresos</span>
            <TrendingUp size={20} className="text-success" />
          </div>
          <span className="text-2xl font-bold text-success">{formatMoney(totalIncome)}</span>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">Gastos</span>
            <TrendingDown size={20} className="text-error" />
          </div>
          <span className="text-2xl font-bold text-error">{formatMoney(totalExpense)}</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl">
          <EmptyState icon={Wallet} title="Sin registros" description="Agrega tu primer ingreso o gasto para empezar a controlar tus finanzas"
            action={<button onClick={() => { setEditing(null); setModalOpen(true) }}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Agregar registro</button>} />
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl divide-y divide-border">
          {filtered.map((record) => (
            <div key={record.id} className="flex items-center justify-between px-5 py-4 hover:bg-surface-hover transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${record.type === 'income' ? 'bg-success/10' : 'bg-error/10'}`}>
                  {record.type === 'income' ? <TrendingUp size={18} className="text-success" /> : <TrendingDown size={18} className="text-error" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{record.title}</p>
                  <p className="text-xs text-text-muted">{record.category} · {record.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-sm font-semibold ${record.type === 'income' ? 'text-success' : 'text-error'}`}>
                  {record.type === 'income' ? '+' : '-'}{formatMoney(Number(record.amount))}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(record); setModalOpen(true) }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-bg transition-colors"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(record.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <FinanceModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={handleSave} initial={editing} />
    </div>
  )
}
