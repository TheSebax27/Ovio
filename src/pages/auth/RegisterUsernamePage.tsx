import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const RESERVED = ['admin', 'support', 'help', 'ovio', 'api', 'root', 'system', 'login', 'settings']
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

export default function RegisterUsernamePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function validate(val: string): string | null {
    if (!USERNAME_REGEX.test(val)) return 'Entre 3 y 20 caracteres: letras, números y guion bajo'
    if (RESERVED.includes(val.toLowerCase())) return 'Este nombre está reservado'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate(username)
    if (err) { setError(err); return }

    setSaving(true)
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        username,
        username_lower: username.toLowerCase(),
      })
      .eq('id', user!.id)

    if (dbError) {
      setError(dbError.message.includes('unique') ? 'Este username ya está en uso' : dbError.message)
      setSaving(false)
      return
    }
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-2">Elige tu username</h1>
        <p className="text-text-muted text-sm mb-6">Este será tu identidad en Ovio</p>
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError('') }}
            className="w-full bg-bg border border-border rounded-lg pl-8 pr-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition-colors"
            placeholder="sebvisions"
            maxLength={20}
            autoFocus
          />
        </div>
        {error && <p className="text-error text-sm mb-4">{error}</p>}
        <button
          type="submit"
          disabled={saving || username.length < 3}
          className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? 'Guardando...' : 'Continuar'}
        </button>
      </form>
    </div>
  )
}
