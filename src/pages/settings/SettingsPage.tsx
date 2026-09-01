import { useState, useRef } from 'react'
import { Camera } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'

export default function SettingsPage() {
  const { user, profile, fetchProfile } = useAuth()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = `${publicUrl}?t=${Date.now()}`
      const { error: updateErr } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
      if (updateErr) throw updateErr
      await fetchProfile()
      toast('Foto actualizada')
    } catch {
      toast('Error al subir la foto', 'error')
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>
      <div className="bg-surface border border-border rounded-xl p-6 max-w-lg">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative group">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-white">
                {profile?.name?.charAt(0) ?? '?'}
              </div>
            )}
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera size={20} className="text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <div>
            <p className="font-semibold text-lg">{profile?.name ?? '—'}</p>
            <p className="text-sm text-text-muted">@{profile?.username ?? '—'}</p>
          </div>
        </div>
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
