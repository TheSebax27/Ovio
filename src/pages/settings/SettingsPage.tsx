import { useAuth } from '../../context/AuthContext'

export default function SettingsPage() {
  const { profile } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>
      <div className="bg-surface border border-border rounded-xl p-6 max-w-lg">
        <h2 className="text-lg font-semibold mb-4">Perfil</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Nombre</span>
            <span>{profile?.name ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Email</span>
            <span>{profile?.email ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Username</span>
            <span>@{profile?.username ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Plan</span>
            <span className="capitalize">{profile?.plan ?? 'free'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
