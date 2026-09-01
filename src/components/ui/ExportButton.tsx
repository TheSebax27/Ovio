import { Download } from 'lucide-react'
import { exportToExcel } from '../../services/exportService'

interface ExportButtonProps {
  data: Record<string, unknown>[]
  fileName: string
  label?: string
}

export default function ExportButton({ data, fileName, label = 'Exportar' }: ExportButtonProps) {
  if (data.length === 0) return null

  return (
    <button onClick={() => exportToExcel(data, fileName)}
      className="flex items-center gap-2 text-sm text-text-muted hover:text-text bg-bg border border-border px-3 py-2 rounded-lg transition-colors">
      <Download size={16} />
      {label}
    </button>
  )
}
