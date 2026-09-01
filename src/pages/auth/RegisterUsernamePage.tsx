import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Check, X, Loader2 } from 'lucide-react'
import ovioLogo from '../../assets/Ovio.png'

const RESERVED = ['admin', 'support', 'help', 'ovio', 'api', 'root', 'system', 'login', 'settings']
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

export default function RegisterUsernamePage() {
  const { user } = useAuth()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  function getLocalError(val: string): string | null {
    if (!val) return 'Escribe un username'
    if (val.length < 3) return 'Mínimo 3 caracteres'
    if (val.length > 20) return 'Máximo 20 caracteres'
    if (!USERNAME_REGEX.test(val)) return 'Solo letras, números y guion bajo'
    if (RESERVED.includes(val.toLowerCase())) return 'Este nombre está reservado'
    return null
  }

  function generateSuggestions(base: string): string[] {
    const clean = base.toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (clean.length < 2) return []
    return [
      `${clean}_`,
      `${clean}${Math.floor(Math.random() * 99)}`,
      `${clean}_ok`,
      `the_${clean}`,
    ].filter((s) => s.length <= 20)
  }

  useEffect(() => {
    setAvailable(null)
    setSuggestions([])

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const localErr = getLocalError(username)
    if (localErr) {
      setError(localErr)
      return
    }

    setError('')
    setChecking(true)

    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username_lower', username.toLowerCase())
        .maybeSingle()

      if (data) {
        setAvailable(false)
        setError('Este username ya está en uso')
        setSuggestions(generateSuggestions(username))
      } else {
        setAvailable(true)
        setError('')
        setSuggestions([])
      }
      setChecking(false)
    }, 400)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [username])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !available) return

    setSaving(true)
    setError('')

    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('id', user.id)

    if (!count || count === 0) {
      const { error: insertErr } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email ?? '',
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
        avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? '',
        username,
        username_lower: username.toLowerCase(),
      })
      if (insertErr) {
        setError(insertErr.message.includes('unique') ? 'Este username ya está en uso' : insertErr.message)
        setSaving(false)
        return
      }
    } else {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ username, username_lower: username.toLowerCase() })
        .eq('id', user.id)
      if (updateErr) {
        setError(updateErr.message.includes('unique') ? 'Este username ya está en uso' : updateErr.message)
        setSaving(false)
        return
      }
    }

    window.location.href = '/dashboard'
  }

  function selectSuggestion(s: string) {
    setUsername(s)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8">
        <div className="flex flex-col items-center mb-6">
          <img src={ovioLogo} alt="Ovio" className="w-14 h-14 mb-3" />
          <h1 className="text-2xl font-bold">Elige tu username</h1>
          <p className="text-text-muted text-sm mt-1">Este será tu identidad en Ovio</p>
        </div>

        <div className="relative mb-2">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`w-full bg-bg border rounded-lg pl-8 pr-10 py-2.5 text-sm text-text focus:outline-none transition-colors ${
              error ? 'border-error focus:border-error' :
              available ? 'border-success focus:border-success' :
              'border-border focus:border-primary'
            }`}
            placeholder="sebvisions"
            maxLength={20}
            autoFocus
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {checking && <Loader2 size={16} className="text-text-muted animate-spin" />}
            {!checking && available === true && <Check size={16} className="text-success" />}
            {!checking && available === false && <X size={16} className="text-error" />}
          </div>
        </div>

        <div className="h-5 mb-3">
          {error && <p className="text-error text-xs">{error}</p>}
          {!error && available && !checking && <p className="text-success text-xs">Disponible</p>}
        </div>

        {suggestions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-text-muted mb-2">Sugerencias:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="text-xs bg-bg border border-border px-3 py-1.5 rounded-lg text-text-muted hover:text-text hover:border-primary transition-colors"
                >
                  @{s}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !available || checking}
          className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? 'Guardando...' : 'Continuar'}
        </button>
      </form>
    </div>
  )
}
