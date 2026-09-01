import { useEffect, useState, useMemo } from 'react'
import { Wallet, Film, CalendarDays, Flame, TrendingUp, TrendingDown, BookOpen, MapPin, Music, Trophy, PiggyBank, Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getFinances } from '../../services/financeService'
import { getMovies } from '../../services/movieService'
import { getEvents } from '../../services/eventService'
import { getJournalEntries } from '../../services/journalService'
import { getPlaces } from '../../services/placeService'
import type { Finance, Movie, Event, JournalEntry, Place } from '../../types'

function formatMoney(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}

const QUOTES = [
  'La mejor inversión que puedes hacer es en ti mismo.',
  'Cada día es una nueva oportunidad para empezar de nuevo.',
  'No cuentes los días, haz que los días cuenten.',
  'El éxito es la suma de pequeños esfuerzos repetidos día tras día.',
  'Tu vida es tu historia. Escríbela bien, edita frecuentemente.',
  'La disciplina es el puente entre las metas y los logros.',
  'Haz hoy lo que otros no quieren, mañana tendrás lo que otros no tienen.',
  'Las pequeñas cosas de la vida son las que más importan.',
  'El mejor momento para empezar fue ayer. El segundo mejor es hoy.',
  'Quien tiene un porqué para vivir, encontrará casi siempre el cómo.',
  'La constancia es más valiosa que la perfección.',
  'Registra tu vida y descubrirás quién eres realmente.',
]

interface FeedItem {
  id: string
  icon: React.ReactNode
  text: string
  date: string
  color: string
}

interface OnThisDayItem {
  text: string
  icon: React.ReactNode
  color: string
}

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [finances, setFinances] = useState<Finance[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)

  const quote = useMemo(() => QUOTES[new Date().getDate() % QUOTES.length], [])

  useEffect(() => {
    if (!user) return
    Promise.all([
      getFinances(user.id),
      getMovies(user.id),
      getEvents(user.id),
      getJournalEntries(user.id),
      getPlaces(user.id),
    ]).then(([f, m, e, j, p]) => {
      setFinances(f); setMovies(m); setEvents(e); setJournal(j); setPlaces(p)
      setLoading(false)
    })
  }, [user])

  const balance = useMemo(() => {
    const income = finances.filter((f) => f.type === 'income').reduce((s, f) => s + Number(f.amount), 0)
    const expense = finances.filter((f) => f.type === 'expense').reduce((s, f) => s + Number(f.amount), 0)
    return income - expense
  }, [finances])

  const journalStreak = useMemo(() => {
    if (journal.length === 0) return 0
    const dates = journal.map((j) => j.created_at.split('T')[0]).sort().reverse()
    let streak = 0
    const today = new Date()
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today)
      expected.setDate(expected.getDate() - i)
      const expectedStr = expected.toISOString().split('T')[0]
      if (dates.includes(expectedStr)) streak++
      else break
    }
    return streak
  }, [journal])

  const onThisDay = useMemo((): OnThisDayItem[] => {
    const today = new Date()
    const mmdd = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const thisYear = today.getFullYear()
    const items: OnThisDayItem[] = []

    for (const f of finances) {
      if (f.date.endsWith(mmdd) && !f.date.startsWith(String(thisYear))) {
        const yr = f.date.split('-')[0]
        items.push({ text: `${yr}: ${f.type === 'income' ? 'Ingreso' : 'Gasto'} "${f.title}" (${formatMoney(Number(f.amount))})`, icon: <TrendingUp size={14} className="text-success" />, color: 'bg-success/10' })
      }
    }
    for (const j of journal) {
      const jDate = j.created_at.split('T')[0]
      if (jDate.endsWith(mmdd) && !jDate.startsWith(String(thisYear))) {
        const yr = jDate.split('-')[0]
        items.push({ text: `${yr}: Escribiste "${j.title}"`, icon: <BookOpen size={14} className="text-warning" />, color: 'bg-warning/10' })
      }
    }
    for (const m of movies) {
      if (m.watched_at?.endsWith(mmdd) && !m.watched_at.startsWith(String(thisYear))) {
        const yr = m.watched_at.split('-')[0]
        items.push({ text: `${yr}: Viste "${m.title}"`, icon: <Film size={14} className="text-primary" />, color: 'bg-primary/10' })
      }
    }
    for (const e of events) {
      if (e.event_date.endsWith(mmdd) && !e.event_date.startsWith(String(thisYear))) {
        const yr = e.event_date.split('-')[0]
        items.push({ text: `${yr}: ${e.type === 'concert' ? 'Concierto' : 'Partido'} "${e.title}"`, icon: <Music size={14} className="text-secondary" />, color: 'bg-secondary/10' })
      }
    }
    for (const p of places) {
      if (p.visited_at?.endsWith(mmdd) && !p.visited_at.startsWith(String(thisYear))) {
        const yr = p.visited_at.split('-')[0]
        items.push({ text: `${yr}: Visitaste "${p.name}"`, icon: <MapPin size={14} className="text-error" />, color: 'bg-error/10' })
      }
    }
    return items
  }, [finances, journal, movies, events, places])

  const feed = useMemo((): FeedItem[] => {
    const items: FeedItem[] = []
    for (const f of finances.slice(0, 10)) {
      items.push({
        id: `fin-${f.id}`,
        icon: f.type === 'income' ? <TrendingUp size={16} className="text-success" /> : <TrendingDown size={16} className="text-error" />,
        text: f.type === 'income' ? `Ingreso: ${f.title} (+${formatMoney(Number(f.amount))})` : `Gasto: ${f.title} (-${formatMoney(Number(f.amount))})`,
        date: f.date,
        color: f.type === 'income' ? 'bg-success/10' : 'bg-error/10',
      })
    }
    for (const m of movies.slice(0, 10)) {
      items.push({
        id: `mov-${m.id}`,
        icon: <Film size={16} className="text-primary" />,
        text: `${m.status === 'completed' ? 'Viste' : m.status === 'watching' ? 'Estás viendo' : 'Quieres ver'}: ${m.title}${m.rating ? ` (${m.rating}/10)` : ''}`,
        date: m.watched_at ?? m.id.slice(0, 10),
        color: 'bg-primary/10',
      })
    }
    for (const e of events.slice(0, 10)) {
      items.push({
        id: `evt-${e.id}`,
        icon: e.type === 'concert' ? <Music size={16} className="text-secondary" /> : <Trophy size={16} className="text-success" />,
        text: `${e.type === 'concert' ? 'Concierto' : 'Partido'}: ${e.title} en ${e.venue}`,
        date: e.event_date,
        color: e.type === 'concert' ? 'bg-secondary/10' : 'bg-success/10',
      })
    }
    for (const j of journal.slice(0, 10)) {
      items.push({
        id: `jrn-${j.id}`,
        icon: <BookOpen size={16} className="text-warning" />,
        text: `Escribiste: ${j.title}`,
        date: j.created_at.split('T')[0],
        color: 'bg-warning/10',
      })
    }
    for (const p of places.slice(0, 10)) {
      items.push({
        id: `plc-${p.id}`,
        icon: <MapPin size={16} className="text-error" />,
        text: `Visitaste: ${p.name}, ${p.city}${p.rating ? ` (${'★'.repeat(p.rating)})` : ''}`,
        date: p.visited_at ?? p.id.slice(0, 10),
        color: 'bg-error/10',
      })
    }
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20)
  }, [finances, movies, events, journal, places])

  const stats = [
    { label: 'Balance', value: formatMoney(balance), icon: Wallet, color: balance >= 0 ? 'text-success' : 'text-error' },
    { label: 'Películas', value: String(movies.length), icon: Film, color: 'text-primary' },
    { label: 'Eventos', value: String(events.length), icon: CalendarDays, color: 'text-secondary' },
    { label: 'Racha', value: `${journalStreak} días`, icon: Flame, color: 'text-warning' },
  ]

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Hola, {profile?.name?.split(' ')[0] ?? 'usuario'}</h1>
      <p className="text-sm text-text-muted mb-6 italic">"{quote}"</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-text-muted">{label}</span>
              <Icon size={20} className={color} />
            </div>
            <span className={`text-2xl font-bold ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {onThisDay.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={18} className="text-primary" />
            <h2 className="text-lg font-semibold">Un día como hoy</h2>
          </div>
          <div className="space-y-2">
            {onThisDay.map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-surface border border-border rounded-xl px-5 py-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.color}`}>
                  {item.icon}
                </div>
                <p className="text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4">Tu línea del tiempo</h2>
      {feed.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <PiggyBank size={40} className="mx-auto text-text-muted/30 mb-3" />
          <p className="text-text-muted">Empieza a registrar para ver tu línea del tiempo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {feed.map((item) => (
            <div key={item.id} className="flex items-center gap-4 bg-surface border border-border rounded-xl px-5 py-3 hover:bg-surface-hover transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{item.text}</p>
              </div>
              <span className="text-xs text-text-muted whitespace-nowrap">{item.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
