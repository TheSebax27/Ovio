import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon size={48} className="text-text-muted/40 mb-4" />
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-text-muted mb-6 max-w-xs">{description}</p>
      {action}
    </div>
  )
}
