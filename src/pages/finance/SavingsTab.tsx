import { useEffect, useState } from 'react'
import { Plus, PiggyBank, Trash2, Pencil, Target } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getSavingsGoals, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal, getContributions, createContribution } from '../../services/savingsService'
import SavingsGoalModal from '../../components/modals/SavingsGoalModal'
import EmptyState from '../../components/ui/EmptyState'
import type { SavingsGoal, SavingsContribution } from '../../types'

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}

export default function SavingsTab() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SavingsGoal | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [contributions, setContributions] = useState<Record<string, SavingsContribution[]>>({})
  const [contribAmount, setContribAmount] = useState('')
  const [contribNote, setContribNote] = useState('')

  useEffect(() => {
    if (!user) return
    getSavingsGoals(user.id).then((data) => { setGoals(data); setLoading(false) })
  }, [user])

  async function toggleExpand(goalId: string) {
    if (expandedId === goalId) { setExpandedId(null); return }
    if (!contributions[goalId]) {
      const c = await getContributions(goalId)
      setContributions((prev) => ({ ...prev, [goalId]: c }))
    }
    setExpandedId(goalId)
    setContribAmount('')
    setContribNote('')
  }

  async function handleSave(data: Omit<SavingsGoal, 'id' | 'user_id'>) {
    if (!user) return
    if (editing) {
      const updated = await updateSavingsGoal(editing.id, data)
      setGoals((prev) => prev.map((g) => g.id === editing.id ? updated : g))
    } else {
      const created = await createSavingsGoal({ ...data, user_id: user.id })
      setGoals((prev) => [created, ...prev])
    }
    setEditing(null)
    setModalOpen(false)
  }

  async function handleAddContribution(goal: SavingsGoal) {
    if (!contribAmount) return
    const amount = parseFloat(contribAmount)
    const contrib = await createContribution({
      goal_id: goal.id,
      amount,
      note: contribNote.trim() || null,
      date: new Date().toISOString().split('T')[0],
    })
    setContributions((prev) => ({ ...prev, [goal.id]: [contrib, ...(prev[goal.id] ?? [])] }))
    const newCurrent = Number(goal.current_amount) + amount
    const updated = await updateSavingsGoal(goal.id, {
      current_amount: newCurrent,
      status: newCurrent >= Number(goal.target_amount) ? 'completed' : 'active',
    })
    setGoals((prev) => prev.map((g) => g.id === goal.id ? updated : g))
    setContribAmount('')
    setContribNote('')
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-end mb-6">
        <button onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Plus size={18} /> Nueva meta
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl">
          <EmptyState icon={Target} title="Sin metas de ahorro" description="Crea una meta y empieza a ahorrar con propósito" />
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const pct = Math.min(100, (Number(goal.current_amount) / Number(goal.target_amount)) * 100)
            return (
              <div key={goal.id} className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-4 cursor-pointer hover:bg-surface-hover transition-colors" onClick={() => toggleExpand(goal.id)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <PiggyBank size={20} className={goal.status === 'completed' ? 'text-success' : 'text-primary'} />
                      <div>
                        <p className="text-sm font-medium">{goal.title}</p>
                        <p className="text-xs text-text-muted">
                          {goal.deadline && `Límite: ${goal.deadline}`}
                          {goal.status === 'completed' && <span className="ml-2 text-success font-medium">Completada</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatMoney(Number(goal.current_amount))} <span className="text-text-muted font-normal">/ {formatMoney(Number(goal.target_amount))}</span></p>
                    </div>
                  </div>
                  <div className="w-full bg-bg rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full transition-all ${goal.status === 'completed' ? 'bg-success' : 'bg-primary'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-text-muted mt-1 text-right">{pct.toFixed(0)}%</p>
                </div>
                {expandedId === goal.id && (
                  <div className="border-t border-border px-5 py-4 space-y-3">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditing(goal); setModalOpen(true) }}
                        className="flex items-center gap-1 text-xs text-text-muted hover:text-text px-2 py-1 rounded bg-bg"><Pencil size={14} /> Editar</button>
                      <button onClick={async () => { await deleteSavingsGoal(goal.id); setGoals((p) => p.filter((g) => g.id !== goal.id)); setExpandedId(null) }}
                        className="flex items-center gap-1 text-xs text-error hover:text-error/80 px-2 py-1 rounded bg-bg"><Trash2 size={14} /> Eliminar</button>
                    </div>
                    {goal.status === 'active' && (
                      <div className="flex gap-2">
                        <input type="number" placeholder="Monto" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} min="0" step="0.01"
                          className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
                        <input type="text" placeholder="Nota" value={contribNote} onChange={(e) => setContribNote(e.target.value)}
                          className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary" />
                        <button onClick={() => handleAddContribution(goal)} disabled={!contribAmount}
                          className="bg-success hover:bg-success/80 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Aportar</button>
                      </div>
                    )}
                    {(contributions[goal.id] ?? []).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-text-muted font-medium">Historial de aportes</p>
                        {(contributions[goal.id] ?? []).map((c) => (
                          <div key={c.id} className="flex justify-between text-sm bg-bg rounded-lg px-3 py-2">
                            <span>{c.date} {c.note && <span className="text-text-muted">— {c.note}</span>}</span>
                            <span className="text-success font-medium">+{formatMoney(Number(c.amount))}</span>
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
      <SavingsGoalModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={handleSave} initial={editing} />
    </div>
  )
}
