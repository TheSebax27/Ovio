import { useState, useRef } from 'react'
import { ImagePlus, X, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { compressToWebP } from '../../services/imageService'
import { uploadImageToDrive, hasDriveToken } from '../../services/driveService'

interface ImageUploaderProps {
  value: string | null
  onChange: (url: string | null) => void
  className?: string
}

export default function ImageUploader({ value, onChange, className = '' }: ImageUploaderProps) {
  const { user, reconnectDrive } = useAuth()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!hasDriveToken()) {
      toast('Necesitas reconectar Google Drive', 'error')
      return
    }

    setUploading(true)
    try {
      const webp = await compressToWebP(file)
      const name = `${Date.now()}.webp`
      const url = await uploadImageToDrive(user.id, webp, name)
      onChange(url)
      toast('Imagen subida')
    } catch (err: any) {
      if (err.message === 'DRIVE_TOKEN_EXPIRED' || err.message === 'NO_DRIVE_TOKEN') {
        toast('Sesión de Drive expirada, reconectando...', 'error')
        reconnectDrive()
        return
      }
      toast('Error al subir imagen', 'error')
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  if (!hasDriveToken()) {
    return (
      <button
        type="button"
        onClick={() => reconnectDrive()}
        className={`flex items-center gap-2 px-4 py-3 border border-dashed border-border rounded-xl text-sm text-text-muted hover:border-primary hover:text-primary transition-colors ${className}`}
      >
        <RefreshCw size={18} />
        Conectar Google Drive para subir fotos
      </button>
    )
  }

  return (
    <div className={className}>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="" className="h-32 rounded-xl object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-error rounded-full flex items-center justify-center text-white hover:bg-error/80"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-3 border border-dashed border-border rounded-xl text-sm text-text-muted hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Subiendo...</>
          ) : (
            <><ImagePlus size={18} /> Agregar foto</>
          )}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  )
}
