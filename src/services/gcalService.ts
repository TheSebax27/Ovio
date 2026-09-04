const GCAL_API = 'https://www.googleapis.com/calendar/v3'

function getToken(): string | null {
  return localStorage.getItem('google_drive_token')
}

async function gcalRequest(url: string, init?: RequestInit): Promise<Response> {
  const token = getToken()
  if (!token) throw new Error('NO_TOKEN')
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init?.headers },
  })
  if (res.status === 401) throw new Error('TOKEN_EXPIRED')
  if (!res.ok) throw new Error(`GCal API error: ${res.status}`)
  return res
}

export async function getGCalEvents(timeMin: string, timeMax: string) {
  const params = new URLSearchParams({
    timeMin: new Date(timeMin).toISOString(),
    timeMax: new Date(timeMax).toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  })
  const res = await gcalRequest(`${GCAL_API}/calendars/primary/events?${params}`)
  const data = await res.json()
  return (data.items ?? []) as GCalEvent[]
}

export async function createGCalEvent(title: string, date: string, time?: string | null): Promise<string> {
  const body: any = { summary: title }
  if (time) {
    body.start = { dateTime: `${date}T${time}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
    body.end = { dateTime: `${date}T${time}:00`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
  } else {
    body.start = { date }
    body.end = { date }
  }
  const res = await gcalRequest(`${GCAL_API}/calendars/primary/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const event = await res.json()
  return event.id
}

export async function deleteGCalEvent(eventId: string): Promise<void> {
  try {
    await gcalRequest(`${GCAL_API}/calendars/primary/events/${eventId}`, { method: 'DELETE' })
  } catch {}
}

export interface GCalEvent {
  id: string
  summary: string
  start: { date?: string; dateTime?: string }
  end: { date?: string; dateTime?: string }
}
