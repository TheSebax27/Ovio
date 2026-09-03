import { supabase } from '../lib/supabase'

const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'
const FOLDER_NAME = 'Ovio'

function getToken(): string | null {
  return localStorage.getItem('google_drive_token')
}

export function setDriveToken(token: string) {
  localStorage.setItem('google_drive_token', token)
}

export function clearDriveToken() {
  localStorage.removeItem('google_drive_token')
}

export function hasDriveToken(): boolean {
  return !!getToken()
}

async function driveRequest(url: string, init?: RequestInit): Promise<Response> {
  const token = getToken()
  if (!token) throw new Error('NO_DRIVE_TOKEN')
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init?.headers },
  })
  if (res.status === 401) {
    clearDriveToken()
    throw new Error('DRIVE_TOKEN_EXPIRED')
  }
  if (!res.ok) throw new Error(`Drive API error: ${res.status}`)
  return res
}

async function findOrCreateFolder(userId: string): Promise<string> {
  const { data: profile } = await supabase.from('profiles').select('drive_folder_id').eq('id', userId).single()
  if (profile?.drive_folder_id) {
    try {
      await driveRequest(`${DRIVE_API}/files/${profile.drive_folder_id}?fields=id`)
      return profile.drive_folder_id
    } catch {}
  }

  const searchRes = await driveRequest(
    `${DRIVE_API}/files?q=name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`,
  )
  const searchData = await searchRes.json()
  if (searchData.files?.length > 0) {
    const folderId = searchData.files[0].id
    await supabase.from('profiles').update({ drive_folder_id: folderId }).eq('id', userId)
    return folderId
  }

  const createRes = await driveRequest(`${DRIVE_API}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  })
  const folder = await createRes.json()
  await supabase.from('profiles').update({ drive_folder_id: folder.id }).eq('id', userId)
  return folder.id
}

export async function uploadImageToDrive(userId: string, blob: Blob, filename: string): Promise<string> {
  const folderId = await findOrCreateFolder(userId)

  const metadata = { name: filename, parents: [folderId] }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', blob)

  const res = await driveRequest(`${UPLOAD_API}/files?uploadType=multipart&fields=id`, {
    method: 'POST',
    body: form,
  })
  const file = await res.json()

  await driveRequest(`${DRIVE_API}/files/${file.id}/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  })

  return `https://drive.google.com/uc?id=${file.id}`
}

export async function deleteFileFromDrive(fileUrl: string): Promise<void> {
  const match = fileUrl.match(/id=([a-zA-Z0-9_-]+)/)
  if (!match) return
  try {
    await driveRequest(`${DRIVE_API}/files/${match[1]}`, { method: 'DELETE' })
  } catch {}
}
