import { useState, useRef, useEffect } from 'react'
import { Camera, Save, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../lib/supabase'
import { getPrivacySettings, updatePrivacySettings, updateProfile } from '../../services/socialService'
import type { PrivacySettings } from '../../types'

export default function SettingsPage() {
  const { user, profile, fetchProfile } = useAuth()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const [bio, setBio] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPrivacy, setSavingPrivacy] = useState(false)

  useEffect(() => {
    if (profile) {
      setBio(profile.bio ?? '')
      setIsPublic(profile.is_public ?? true)
    }
    if (user) {
      getPrivacySettings(user.id).then((ps) => {
        if (ps) setPrivacy(ps)
        else setPrivacy({ user_id: user.id, show_finances: false, show_movies: true, show_events: true, show_places: true, show_journal: false })
      })
    }
  }, [user, profile])

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

  async function handleSaveProfile() {
    if (!user) return
    setSavingProfile(true)
    try {
      await updateProfile(user.id, { bio, is_public: isPublic })
      await fetchProfile()
      toast('Perfil actualizado')
    } catch {
      toast('Error al guardar', 'error')
    }
    setSavingProfile(false)
  }

  async function handleSavePrivacy() {
    if (!user || !privacy) return
    setSavingPrivacy(true)
    try {
      await updatePrivacySettings(user.id, privacy)
      toast('Privacidad actualizada')
    } catch {
      toast('Error al guardar', 'error')
    }
    setSavingPrivacy(false)
  }

  const privacyToggles = [
    { key: 'show_movies' as const, label: 'Películas / Series' },
    { key: 'show_events' as const, label: 'Eventos' },
    { key: 'show_places' as const, label: 'Lugares' },
    { key: 'show_journal' as const, label: 'Diario' },
    { key: 'show_finances' as const, label: 'Finanzas' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuración</h1>

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
        <div className="space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Email</span>
              <span>{profile?.email ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Plan</span>
              <span className="capitalize">{profile?.plan ?? 'free'}</span>
            </div>
          </div>

          <div>
            <label className="text-sm text-text-muted block mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={3}
              placeholder="Cuéntale al mundo algo sobre ti..."
              className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary resize-none"
            />
            <p className="text-xs text-text-muted text-right">{bio.length}/160</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Perfil público</p>
              <p className="text-xs text-text-muted">Otros usuarios pueden encontrarte y ver tu perfil</p>
            </div>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isPublic ? 'bg-success/10 text-success' : 'bg-bg border border-border text-text-muted'
              }`}
            >
              {isPublic ? <><Eye size={14} /> Público</> : <><EyeOff size={14} /> Privado</>}
            </button>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {savingProfile ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 max-w-lg">
        <h2 className="text-lg font-semibold mb-2">Privacidad por módulo</h2>
        <p className="text-xs text-text-muted mb-4">Elige qué módulos pueden ver las personas que visitan tu perfil</p>

        <div className="space-y-3">
          {privacyToggles.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm">{label}</span>
              <button
                onClick={() => setPrivacy((p) => p ? { ...p, [key]: !p[key] } : p)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  privacy?.[key] ? 'bg-primary' : 'bg-border'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  privacy?.[key] ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSavePrivacy}
          disabled={savingPrivacy}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 mt-5"
        >
          <Save size={16} />
          {savingPrivacy ? 'Guardando...' : 'Guardar privacidad'}
        </button>
      </div>
    </div>
  )
}
