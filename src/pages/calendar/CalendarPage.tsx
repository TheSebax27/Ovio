import { useEffect, useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, BookOpen, Music, Trophy, TrendingDown, Receipt, Plus, CheckSquare, Square, Trash2, Edit3, CalendarSync, CalendarOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getEvents } from '../../services/eventService'
import { getJournalEntries } from '../../services/journalService'
import { getFinances } from '../../services/financeService'
import { getFixedExpenses } from '../../services/fixedExpenseService'
import { getTasks, createTask, updateTask, deleteTask, toggleTask } from '../../services/taskService'
import { getGCalEvents, createGCalEvent, deleteGCalEvent } from '../../services/gcalService'
import { hasDriveToken } from '../../services/driveService'
import { supabase } from '../../lib/supabase'
import TaskModal from '../../components/modals/TaskModal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import type { Event, JournalEntry, Finance, FixedExpense, Task } from '../../types'
import type { GCalEvent } from '../../services/gcalService'

interface DayItem {
  icon: React.ReactNode
  label: string
  color: string
  type: string
}

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function CalendarPage() {
  const { user, profile, reconnectDrive, fetchProfile } = useAuth()
  const { toast } = useToast()
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [events, setEvents] = useState<Event[]>([])
  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [finances, setFinances] = useState<Finance[]>([])
  const [fixedExp, setFixedExp] = useState<FixedExpense[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [gcalEvents, setGcalEvents] = useState<GCalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const gcalSync = profile?.gcal_sync ?? false

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  useEffect(() => {
    if (gcalSync && hasDriveToken()) loadGCalEvents()
  }, [month, year, gcalSync])

  async function loadData() {
    if (!user) return
    const [ev, jn, fn, fx, tk] = await Promise.all([
      getEvents(user.id),
      getJournalEntries(user.id),
      getFinances(user.id),
      getFixedExpenses(user.id),
      getTasks(user.id).catch(() => [] as Task[]),
    ])
    setEvents(ev); setJournal(jn); setFinances(fn); setFixedExp(fx); setTasks(tk)
    setLoading(false)
  }

  async function loadGCalEvents() {
    try {
      const timeMin = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const lastDay = new Date(year, month + 1, 0).getDate()
      const timeMax = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`
      const evs = await getGCalEvents(timeMin, timeMax)
      setGcalEvents(evs)
    } catch {
      setGcalEvents([])
    }
  }

  async function toggleGCalSync() {
    if (!user) return
    if (!gcalSync && !hasDriveToken()) {
      toast('Necesitas reconectar Google para activar Calendar', 'error')
      reconnectDrive()
      return
    }
    const newVal = !gcalSync
    await supabase.from('profiles').update({ gcal_sync: newVal }).eq('id', user.id)
    await fetchProfile()
    toast(newVal ? 'Google Calendar activado' : 'Google Calendar desactivado')
    if (newVal) loadGCalEvents()
    else setGcalEvents([])
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7

  const dayMap = useMemo(() => {
    const map: Record<string, DayItem[]> = {}
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`

    for (const t of tasks) {
      if (t.date.startsWith(prefix)) {
        if (!map[t.date]) map[t.date] = []
        map[t.date].push({
          icon: t.completed ? <CheckSquare size={10} /> : <Square size={10} />,
          label: t.title,
          color: t.completed ? 'bg-success/60' : t.priority === 'high' ? 'bg-error' : t.priority === 'medium' ? 'bg-warning' : 'bg-text-muted',
          type: 'task',
        })
      }
    }
    for (const e of events) {
      if (e.event_date.startsWith(prefix)) {
        if (!map[e.event_date]) map[e.event_date] = []
        map[e.event_date].push({
          icon: e.type === 'concert' ? <Music size={10} /> : <Trophy size={10} />,
          label: e.title, color: e.type === 'concert' ? 'bg-secondary' : 'bg-success', type: 'event',
        })
      }
    }
    for (const j of journal) {
      const d = j.created_at.split('T')[0]
      if (d.startsWith(prefix)) {
        if (!map[d]) map[d] = []
        map[d].push({ icon: <BookOpen size={10} />, label: j.title, color: 'bg-warning', type: 'journal' })
      }
    }
    for (const f of finances) {
      if (f.date.startsWith(prefix) && f.type === 'expense') {
        if (!map[f.date]) map[f.date] = []
        map[f.date].push({ icon: <TrendingDown size={10} />, label: f.title, color: 'bg-error', type: 'finance' })
      }
    }
    for (const fx of fixedExp) {
      const day = String(fx.due_day).padStart(2, '0')
      const d = `${prefix}-${day}`
      if (fx.due_day <= daysInMonth) {
        if (!map[d]) map[d] = []
        map[d].push({ icon: <Receipt size={10} />, label: fx.title, color: 'bg-primary', type: 'fixed' })
      }
    }
    for (const gc of gcalEvents) {
      const d = gc.start.date ?? gc.start.dateTime?.split('T')[0]
      if (d && d.startsWith(prefix)) {
        if (!map[d]) map[d] = []
        map[d].push({ icon: <CalendarSync size={10} />, label: gc.summary, color: 'bg-blue-500', type: 'gcal' })
      }
    }
    return map
  }, [events, journal, finances, fixedExp, tasks, gcalEvents, month, year, daysInMonth])

  const dayTasks = useMemo(() => {
    if (!selectedDay) return []
    return tasks.filter((t) => t.date === selectedDay).sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      return (a.time ?? '').localeCompare(b.time ?? '')
    })
  }, [tasks, selectedDay])

  async function handleSaveTask(data: any) {
    if (!user) return
    try {
      if (editingTask) {
        await updateTask(editingTask.id, data)
        toast('Tarea actualizada')
      } else {
        const task = await createTask({ ...data, user_id: user.id, gcal_event_id: null })
        if (gcalSync && hasDriveToken()) {
          try {
            const gcalId = await createGCalEvent(data.title, data.date, data.time)
            await updateTask(task.id, { gcal_event_id: gcalId })
          } catch {}
        }
        toast('Tarea creada')
      }
      setModalOpen(false)
      setEditingTask(null)
      loadData()
    } catch { toast('Error al guardar tarea', 'error') }
  }

  async function handleDeleteTask() {
    if (!deleteId) return
    try {
      const task = tasks.find((t) => t.id === deleteId)
      if (task?.gcal_event_id && gcalSync) {
        await deleteGCalEvent(task.gcal_event_id)
      }
      await deleteTask(deleteId)
      toast('Tarea eliminada')
      setDeleteId(null)
      loadData()
    } catch { toast('Error al eliminar', 'error') }
  }

  async function handleToggle(task: Task) {
    try {
      await toggleTask(task.id, !task.completed)
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, completed: !t.completed } : t))
    } catch { toast('Error', 'error') }
  }

  function prev() {
    if (month === 0) { setMonth(11); setYear(year - 1) } else setMonth(month - 1)
    setSelectedDay(null)
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(year + 1) } else setMonth(month + 1)
    setSelectedDay(null)
  }

  const todayStr = new Date().toISOString().split('T')[0]

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Calendario</h1>
        <div className="flex items-center gap-2">
          <button onClick={toggleGCalSync}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              gcalSync ? 'bg-blue-500/10 text-blue-500' : 'bg-bg border border-border text-text-muted hover:text-text'
            }`}>
            {gcalSync ? <><CalendarSync size={14} /> Google Calendar</> : <><CalendarOff size={14} /> Sync Calendar</>}
          </button>
          <button onClick={() => { setEditingTask(null); setModalOpen(true) }}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
            <Plus size={14} /> Tarea
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mb-4">
        <button onClick={prev} className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-text-muted hover:text-text"><ChevronLeft size={20} /></button>
        <span className="text-sm font-medium w-36 text-center">{MONTHS[month]} {year}</span>
        <button onClick={next} className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-text-muted hover:text-text"><ChevronRight size={20} /></button>
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

      {selectedDay && (
        <div className="mt-4 bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <button onClick={() => { setEditingTask(null); setModalOpen(true) }}
              className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Plus size={12} /> Agregar tarea
            </button>
          </div>

          {dayTasks.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Tareas</p>
              {dayTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 group">
                  <button onClick={() => handleToggle(task)} className="shrink-0">
                    {task.completed
                      ? <CheckSquare size={18} className="text-success" />
                      : <Square size={18} className="text-text-muted" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${task.completed ? 'line-through text-text-muted' : ''}`}>{task.title}</p>
                    <div className="flex items-center gap-2">
                      {task.time && <span className="text-xs text-text-muted">{task.time.slice(0, 5)}</span>}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        task.priority === 'high' ? 'bg-error/10 text-error'
                          : task.priority === 'medium' ? 'bg-warning/10 text-warning'
                          : 'bg-success/10 text-success'
                      }`}>{task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingTask(task); setModalOpen(true) }} className="p-1 text-text-muted hover:text-text"><Edit3 size={14} /></button>
                    <button onClick={() => setDeleteId(task.id)} className="p-1 text-text-muted hover:text-error"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(dayMap[selectedDay] ?? []).filter((i) => i.type !== 'task').length > 0 && (
            <div className="space-y-2">
              {dayTasks.length > 0 && <p className="text-xs text-text-muted font-medium uppercase tracking-wide">Otros</p>}
              {(dayMap[selectedDay] ?? []).filter((i) => i.type !== 'task').map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded flex items-center justify-center ${item.color} text-white`}>{item.icon}</div>
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {dayTasks.length === 0 && (dayMap[selectedDay] ?? []).filter((i) => i.type !== 'task').length === 0 && (
            <p className="text-sm text-text-muted text-center py-2">Sin actividad este día</p>
          )}
        </div>
      )}

      <TaskModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingTask(null) }}
        onSave={handleSaveTask} initial={editingTask} defaultDate={selectedDay ?? undefined} />
      <ConfirmDialog open={!!deleteId} title="Eliminar tarea" message="¿Seguro que quieres eliminar esta tarea?"
        onConfirm={handleDeleteTask} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
