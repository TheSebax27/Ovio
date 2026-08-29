import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  Film,
  CalendarDays,
  BookOpen,
  MapPin,
  Crown,
  Settings,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/finance', icon: Wallet, label: 'Finanzas' },
  { to: '/entertainment', icon: Film, label: 'Entretenimiento' },
  { to: '/events', icon: CalendarDays, label: 'Eventos' },
  { to: '/journal', icon: BookOpen, label: 'Diario' },
  { to: '/places', icon: MapPin, label: 'Lugares' },
  { to: '/premium', icon: Crown, label: 'Premium' },
  { to: '/settings', icon: Settings, label: 'Configuración' },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface border-r border-border flex flex-col z-30">
      <div className="h-16 flex items-center px-6">
        <span className="text-2xl font-bold tracking-tight text-primary">Ovio</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-muted hover:text-text hover:bg-surface-hover'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
