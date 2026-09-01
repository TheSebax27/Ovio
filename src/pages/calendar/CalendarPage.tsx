import { useEffect, useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, BookOpen, Music, Trophy, TrendingDown, Receipt } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getEvents } from '../../services/eventService'
import { getJournalEntries } from '../../services/journalService'
import { getFinances } from '../../services/financeService'
import { getFixedExpenses } from '../../services/fixedExpenseService'
import type { Event, JournalEntry, Finance, FixedExpense } from '../../types'

interface DayItem {
  icon: React.ReactNode
  label: string
  color: string
}

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function CalendarPage() {
  const { user } = useAuth()
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [events, setEvents] = useState<Event[]>([])
  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [finances, setFinances] = useState<Finance[]>([])
  const [fixedExp, setFixedExp] = useState<FixedExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      getEvents(user.id),
      getJournalEntries(user.id),
      getFinances(user.id),
      getFixedExpenses(user.id),
    ]).then(([ev, jn, fn, fx]) => {
      setEvents(ev); setJournal(jn); setFinances(fn); setFixedExp(fx)
      setLoading(false)
    })
  }, [user])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7

  const dayMap = useMemo(() => {
    const map: Record<string, DayItem[]> = {}
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`

    for (const e of events) {
      if (e.event_date.startsWith(prefix)) {
        const d = e.event_date
        if (!map[d]) map[d] = []
        map[d].push({
          icon: e.type === 'concert' ? <Music size={10} /> : <Trophy size={10} />,
          label: e.title,
          color: e.type === 'concert' ? 'bg-secondary' : 'bg-success',
        })
      }
    }
    for (const j of journal) {
      const d = j.created_at.split('T')[0]
      if (d.startsWith(prefix)) {
        if (!map[d]) map[d] = []
        map[d].push({ icon: <BookOpen size={10} />, label: j.title, color: 'bg-warning' })
      }
    }
    for (const f of finances) {
      if (f.date.startsWith(prefix) && f.type === 'expense') {
        if (!map[f.date]) map[f.date] = []
        map[f.date].push({ icon: <TrendingDown size={10} />, label: f.title, color: 'bg-error' })
      }
    }
    for (const fx of fixedExp) {
      const day = String(fx.due_day).padStart(2, '0')
      const d = `${prefix}-${day}`
      if (fx.due_day <= daysInMonth) {
        if (!map[d]) map[d] = []
        map[d].push({ icon: <Receipt size={10} />, label: fx.title, color: 'bg-primary' })
      }
    }
    return map
  }, [events, journal, finances, fixedExp, month, year, daysInMonth])

  function prev() {
    if (month === 0) { setMonth(11); setYear(year - 1) }
    else setMonth(month - 1)
    setSelectedDay(null)
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(year + 1) }
    else setMonth(month + 1)
    setSelectedDay(null)
  }

  const todayStr = new Date().toISOString().split('T')[0]

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Calendario</h1>
        <div className="flex items-center gap-3">
          <button onClick={prev} className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-text-muted hover:text-text"><ChevronLeft size={20} /></button>
          <span className="text-sm font-medium w-36 text-center">{MONTHS[month]} {year}</span>
          <button onClick={next} className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-text-muted hover:text-text"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-7">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs text-text-muted font-medium py-3 border-b border-border">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-20 border-b border-r border-border" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const items = dayMap[dateStr] ?? []
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDay
            return (
              <div key={day} onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={`min-h-20 border-b border-r border-border p-1.5 cursor-pointer transition-colors hover:bg-surface-hover ${isSelected ? 'bg-primary/5' : ''}`}>
                <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday ? 'bg-primary text-white' : 'text-text-muted'}`}>
                  {day}
                </span>
                <div className="mt-1 space-y-0.5">
                  {items.slice(0, 3).map((item, j) => (
                    <div key={j} className={`${item.color} text-white text-[9px] px-1 py-0.5 rounded truncate flex items-center gap-0.5`}>
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </div>
                  ))}
                  {items.length > 3 && (
                    <span className="text-[9px] text-text-muted">+{items.length - 3} más</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selectedDay && (dayMap[selectedDay] ?? []).length > 0 && (
        <div className="mt-4 bg-surface border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3">{new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
          <div className="space-y-2">
            {(dayMap[selectedDay] ?? []).map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded flex items-center justify-center ${item.color} text-white`}>{item.icon}</div>
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
