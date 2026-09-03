import { NavLink } from 'react-router-dom'
import ovioLogo from '../../assets/Ovio.png'
import {
  LayoutDashboard,
  Wallet,
  Film,
  CalendarDays,
  Calendar,
  BookOpen,
  MapPin,
  Rss,
  Crown,
  Settings,
  X,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/social/feed', icon: Rss, label: 'Feed' },
  { to: '/finance', icon: Wallet, label: 'Finanzas' },
  { to: '/entertainment', icon: Film, label: 'Entretenimiento' },
  { to: '/events', icon: CalendarDays, label: 'Eventos' },
  { to: '/journal', icon: BookOpen, label: 'Diario' },
  { to: '/places', icon: MapPin, label: 'Lugares' },
  { to: '/calendar', icon: Calendar, label: 'Calendario' },
  { to: '/premium', icon: Crown, label: 'Premium' },
  { to: '/settings', icon: Settings, label: 'Configuración' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed left-0 top-0 h-screen w-64 bg-surface border-r border-border flex flex-col z-50 transition-transform duration-200 ${
        open ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <img src={ovioLogo} alt="Ovio" className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight text-primary">Ovio</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-text-muted hover:text-text">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
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
    </>
  )
}
