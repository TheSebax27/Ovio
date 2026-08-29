import { Wallet, Film, CalendarDays, Flame } from 'lucide-react'

const stats = [
  { label: 'Ahorros', value: '$0', icon: Wallet, color: 'text-success' },
  { label: 'Películas', value: '0', icon: Film, color: 'text-primary' },
  { label: 'Eventos', value: '0', icon: CalendarDays, color: 'text-secondary' },
  { label: 'Racha', value: '0 días', icon: Flame, color: 'text-warning' },
]

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Inicio</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-text-muted">{label}</span>
              <Icon size={20} className={color} />
            </div>
            <span className="text-2xl font-bold">{value}</span>
          </div>
        ))}
      </div>
      <div className="bg-surface border border-border rounded-xl p-8 text-center">
        <p className="text-text-muted">Tu línea del tiempo aparecerá aquí</p>
      </div>
    </div>
  )
}
