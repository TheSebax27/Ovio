const API_KEY = import.meta.env.VITE_TMDB_API_KEY ?? ''
const BASE = 'https://api.themoviedb.org/3'
const IMG = 'https://image.tmdb.org/t/p/w500'

export interface TmdbResult {
  id: number
  title: string
  poster_path: string | null
  release_date?: string
  media_type: 'movie' | 'tv'
}

export async function searchTmdb(query: string): Promise<TmdbResult[]> {
  if (!API_KEY || !query.trim()) return []
  const res = await fetch(`${BASE}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=es-CO&page=1`)
  if (!res.ok) return []
  const data = await res.json()
  return (data.results ?? [])
    .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv')
    .slice(0, 8)
    .map((r: any) => ({
      id: r.id,
      title: r.media_type === 'movie' ? r.title : r.name,
      poster_path: r.poster_path,
      release_date: r.release_date ?? r.first_air_date,
      media_type: r.media_type === 'tv' ? 'tv' : 'movie',
    }))
}

export function posterUrl(path: string | null): string | undefined {
  return path ? `${IMG}${path}` : undefined
}
