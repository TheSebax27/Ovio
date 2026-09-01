import { useState } from 'react'
import { Wallet, HandCoins, PiggyBank, Gauge, Receipt, BarChart3 } from 'lucide-react'
import FinanceTransactionsTab from './FinanceTransactionsTab'
import LoansTab from './LoansTab'
import SavingsTab from './SavingsTab'
import BudgetsTab from './BudgetsTab'
import FixedExpensesTab from './FixedExpensesTab'
import SummaryTab from './SummaryTab'

const tabs = [
  { id: 'transactions', label: 'Movimientos', icon: Wallet },
  { id: 'loans', label: 'Préstamos', icon: HandCoins },
  { id: 'savings', label: 'Metas', icon: PiggyBank },
  { id: 'budgets', label: 'Presupuestos', icon: Gauge },
  { id: 'fixed', label: 'Deudas fijas', icon: Receipt },
  { id: 'summary', label: 'Resumen', icon: BarChart3 },
] as const

type TabId = (typeof tabs)[number]['id']

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<TabId>('transactions')

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Finanzas</h1>
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === id
                ? 'bg-primary/10 text-primary'
                : 'text-text-muted hover:text-text hover:bg-surface-hover'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      {activeTab === 'transactions' && <FinanceTransactionsTab />}
      {activeTab === 'loans' && <LoansTab />}
      {activeTab === 'savings' && <SavingsTab />}
      {activeTab === 'budgets' && <BudgetsTab />}
      {activeTab === 'fixed' && <FixedExpensesTab />}
      {activeTab === 'summary' && <SummaryTab />}
    </div>
  )
}
