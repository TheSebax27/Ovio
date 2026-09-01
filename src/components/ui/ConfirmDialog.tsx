import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Eliminar', onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={24} className="text-error" />
        </div>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-sm text-text-muted mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 bg-bg border border-border text-text py-2.5 rounded-lg text-sm font-medium hover:bg-surface-hover transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 bg-error hover:bg-error/80 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
