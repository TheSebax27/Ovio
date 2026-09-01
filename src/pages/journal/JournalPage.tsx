import { useEffect, useState } from 'react'
import { Plus, BookOpen, Trash2, Pencil } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getJournalEntries, createJournalEntry, updateJournalEntry, deleteJournalEntry } from '../../services/journalService'
import JournalModal from '../../components/modals/JournalModal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import ExportButton from '../../components/ui/ExportButton'
import type { JournalEntry } from '../../types'

const MOOD_EMOJI = ['', '😞', '😕', '😐', '😊', '😄']

export default function JournalPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<JournalEntry | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getJournalEntries(user.id).then((data) => { setEntries(data); setLoading(false) })
  }, [user])

  async function handleSave(data: Omit<JournalEntry, 'id' | 'user_id'>) {
    if (!user) return
    try {
      if (editing) {
        const updated = await updateJournalEntry(editing.id, data)
        setEntries((prev) => prev.map((e) => e.id === editing.id ? updated : e))
        toast('Entrada actualizada')
      } else {
        const created = await createJournalEntry({ ...data, user_id: user.id })
        setEntries((prev) => [created, ...prev])
        toast('Entrada creada')
      }
    } catch { toast('Error al guardar', 'error') }
    setEditing(null)
    setModalOpen(false)
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      await deleteJournalEntry(deleteId)
      setEntries((prev) => prev.filter((e) => e.id !== deleteId))
      if (expandedId === deleteId) setExpandedId(null)
      toast('Entrada eliminada')
    } catch { toast('Error al eliminar', 'error') }
    setDeleteId(null)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Diario</h1>
        <div className="flex gap-2">
          <ExportButton data={entries.map((e) => ({ Título: e.title, Contenido: e.content, Mood: e.mood, Fecha: e.created_at.split('T')[0] }))} fileName="diario" />
          <button onClick={() => { setEditing(null); setModalOpen(true) }}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus size={18} /> Nueva entrada
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl">
          <EmptyState icon={BookOpen} title="Tu diario está vacío" description="Empieza a registrar tus días, pensamientos y recuerdos"
            action={<button onClick={() => { setEditing(null); setModalOpen(true) }}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Escribir primera entrada</button>} />
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 cursor-pointer hover:bg-surface-hover transition-colors"
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{MOOD_EMOJI[entry.mood ?? 3]}</span>
                    <div>
                      <p className="text-sm font-medium">{entry.title}</p>
                      <p className="text-xs text-text-muted">{formatDate(entry.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setEditing(entry); setModalOpen(true) }}
                      className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-bg transition-colors"><Pencil size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(entry.id) }}
                      className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
              {expandedId === entry.id && (
                <div className="border-t border-border px-5 py-4">
                  <p className="text-sm text-text-muted whitespace-pre-wrap">{entry.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <JournalModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={handleSave} initial={editing} />
      <ConfirmDialog open={!!deleteId} title="Eliminar entrada" message="Esta entrada del diario se eliminará permanentemente." onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
    </div>
  )
}
