import { useEffect, useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getFinances } from '../../services/financeService'
import type { Finance } from '../../types'

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function SummaryTab() {
  const { user } = useAuth()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [records, setRecords] = useState<Finance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getFinances(user.id).then((data) => { setRecords(data); setLoading(false) })
  }, [user])

  const currentMonth = useMemo(() => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    return records.filter((r) => r.date.startsWith(prefix))
  }, [records, month, year])

  const prevMonth = useMemo(() => {
    const pm = month === 1 ? 12 : month - 1
    const py = month === 1 ? year - 1 : year
    const prefix = `${py}-${String(pm).padStart(2, '0')}`
    return records.filter((r) => r.date.startsWith(prefix))
  }, [records, month, year])

  function sum(arr: Finance[], type: 'income' | 'expense') {
    return arr.filter((r) => r.type === type).reduce((s, r) => s + Number(r.amount), 0)
  }

  const income = sum(currentMonth, 'income')
  const expense = sum(currentMonth, 'expense')
  const savings = income - expense
  const prevIncome = sum(prevMonth, 'income')
  const prevExpense = sum(prevMonth, 'expense')
  const prevSavings = prevIncome - prevExpense

  function diff(current: number, prev: number) {
    if (prev === 0) return null
    return ((current - prev) / prev) * 100
  }

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    for (const r of currentMonth) {
      if (r.type === 'expense') {
        map[r.category] = (map[r.category] ?? 0) + Number(r.amount)
      }
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [currentMonth])

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  function DiffBadge({ current, prev }: { current: number; prev: number }) {
    const d = diff(current, prev)
    if (d === null) return null
    const positive = d >= 0
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${positive ? 'text-success' : 'text-error'}`}>
        {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {Math.abs(d).toFixed(0)}%
      </span>
    )
  }

  return (
    <div>
      <div className="flex gap-2 items-center mb-6">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary">
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary">
          {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">Ingresos</span>
            <TrendingUp size={20} className="text-success" />
          </div>
          <p className="text-2xl font-bold text-success">{formatMoney(income)}</p>
          <DiffBadge current={income} prev={prevIncome} />
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">Gastos</span>
            <TrendingDown size={20} className="text-error" />
          </div>
          <p className="text-2xl font-bold text-error">{formatMoney(expense)}</p>
          <DiffBadge current={prevExpense} prev={expense} />
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">Ahorro neto</span>
            <PiggyBank size={20} className="text-primary" />
          </div>
          <p className={`text-2xl font-bold ${savings >= 0 ? 'text-success' : 'text-error'}`}>{formatMoney(savings)}</p>
          <DiffBadge current={savings} prev={prevSavings} />
        </div>
      </div>

      {categoryBreakdown.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Gastos por categoría</h3>
          <div className="space-y-3">
            {categoryBreakdown.map(([cat, amount]) => {
              const pct = expense > 0 ? (amount / expense) * 100 : 0
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{cat}</span>
                    <span className="text-text-muted">{formatMoney(amount)} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-bg rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
