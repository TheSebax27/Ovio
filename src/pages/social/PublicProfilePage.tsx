import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { UserPlus, UserMinus, Film, CalendarDays, MapPin, BookOpen, Lock, Star, Heart } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getProfileByUsername, isFollowing, followUser, unfollowUser, getFollowers, getFollowing, getPrivacySettings } from '../../services/socialService'
import { getMovies } from '../../services/movieService'
import { getEvents } from '../../services/eventService'
import { getPlaces } from '../../services/placeService'
import { getJournalEntries } from '../../services/journalService'
import { toggleLike, getUserLikes } from '../../services/likeService'
import EmptyState from '../../components/ui/EmptyState'
import type { Profile, PrivacySettings, Movie, Event, Place, JournalEntry, SearchUserResult, EventType } from '../../types'

const TYPE_LABELS: Record<EventType, { label: string; color: string }> = {
  concert: { label: 'Concierto', color: 'bg-secondary' },
  festival: { label: 'Festival', color: 'bg-primary' },
  match: { label: 'Partido', color: 'bg-success' },
  sports: { label: 'Deportes', color: 'bg-success' },
  gastro: { label: 'Gastronomía', color: 'bg-warning' },
  tech: { label: 'Tecnología', color: 'bg-blue-500' },
  art: { label: 'Arte', color: 'bg-pink-500' },
  theater: { label: 'Teatro', color: 'bg-purple-500' },
  networking: { label: 'Networking', color: 'bg-cyan-500' },
  other: { label: 'Otro', color: 'bg-text-muted' },
}

const MONTHS_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null)
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState('movies')

  const [movies, setMovies] = useState<Movie[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [journal, setJournal] = useState<JournalEntry[]>([])

  const [likedEventIds, setLikedEventIds] = useState<Set<string>>(new Set())
  const [likedPlaceIds, setLikedPlaceIds] = useState<Set<string>>(new Set())

  const [followersList, setFollowersList] = useState<SearchUserResult[]>([])
  const [followingList, setFollowingList] = useState<SearchUserResult[]>([])
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)

  useEffect(() => {
    if (!username) return
    loadProfile()
  }, [username])

  async function loadProfile() {
    setLoading(true)
    const p = await getProfileByUsername(username!)
    if (!p || !p.username) { setNotFound(true); setLoading(false); return }

    if (user && p.id === user.id) {
      navigate('/settings')
      return
    }

    setProfile(p as Profile)
    const ps = await getPrivacySettings(p.id)
    setPrivacy(ps)

    if (user) {
      const f = await isFollowing(p.id)
      setFollowing(f)
    }

    const promises: Promise<void>[] = []
    if (ps?.show_movies !== false) {
      promises.push(getMovies(p.id).then(setMovies).catch(() => {}))
    }
    if (ps?.show_events !== false) {
      promises.push(getEvents(p.id).then(setEvents).catch(() => {}))
    }
    if (ps?.show_places !== false) {
      promises.push(getPlaces(p.id).then(setPlaces).catch(() => {}))
    }
    if (ps?.show_journal === true) {
      promises.push(getJournalEntries(p.id).then(setJournal).catch(() => {}))
    }
    if (user) {
      promises.push(getUserLikes('event').then(setLikedEventIds).catch(() => {}))
      promises.push(getUserLikes('place').then(setLikedPlaceIds).catch(() => {}))
    }
    await Promise.all(promises)
    setLoading(false)
  }

  async function handleLikeEvent(eventId: string) {
    if (!user) return
    try {
      const liked = await toggleLike('event', eventId)
      setLikedEventIds((prev) => { const next = new Set(prev); liked ? next.add(eventId) : next.delete(eventId); return next })
      setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, likes_count: (e.likes_count ?? 0) + (liked ? 1 : -1) } : e))
    } catch { toast('Error', 'error') }
  }

  async function handleLikePlace(placeId: string) {
    if (!user) return
    try {
      const liked = await toggleLike('place', placeId)
      setLikedPlaceIds((prev) => { const next = new Set(prev); liked ? next.add(placeId) : next.delete(placeId); return next })
      setPlaces((prev) => prev.map((p) => p.id === placeId ? { ...p, likes_count: (p.likes_count ?? 0) + (liked ? 1 : -1) } : p))
    } catch { toast('Error', 'error') }
  }

  async function handleFollow() {
    if (!profile) return
    try {
      await followUser(profile.id)
      setFollowing(true)
      setProfile((p) => p ? { ...p, followers_count: p.followers_count + 1 } : p)
      toast('Siguiendo a @' + profile.username)
    } catch { toast('Error al seguir', 'error') }
  }

  async function handleUnfollow() {
    if (!profile) return
    try {
      await unfollowUser(profile.id)
      setFollowing(false)
      setProfile((p) => p ? { ...p, followers_count: Math.max(0, p.followers_count - 1) } : p)
      toast('Dejaste de seguir a @' + profile.username)
    } catch { toast('Error', 'error') }
  }

  async function openFollowers() {
    if (!profile) return
    const list = await getFollowers(profile.id)
    setFollowersList(list)
    setShowFollowers(true)
    setShowFollowing(false)
  }

  async function openFollowing() {
    if (!profile) return
    const list = await getFollowing(profile.id)
    setFollowingList(list)
    setShowFollowing(true)
    setShowFollowers(false)
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  if (notFound) return (
    <div className="bg-surface border border-border rounded-xl">
      <EmptyState icon={Lock} title="Usuario no encontrado" description="Este perfil no existe o es privado" />
    </div>
  )

  if (!profile) return null

  const tabs = [
    { key: 'movies', label: 'Películas', icon: Film, count: movies.length, visible: privacy?.show_movies !== false },
    { key: 'events', label: 'Eventos', icon: CalendarDays, count: events.length, visible: privacy?.show_events !== false },
    { key: 'places', label: 'Lugares', icon: MapPin, count: places.length, visible: privacy?.show_places !== false },
    { key: 'journal', label: 'Diario', icon: BookOpen, count: journal.length, visible: privacy?.show_journal === true },
  ].filter((t) => t.visible)

  return (
    <div>
      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-5">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-white shrink-0">
              {profile.name?.charAt(0) ?? '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold">{profile.name}</h1>
              <span className="text-sm text-text-muted">@{profile.username}</span>
            </div>
            {profile.bio && <p className="text-sm text-text-muted mt-1">{profile.bio}</p>}
            <div className="flex items-center gap-4 mt-3 text-sm">
              <button onClick={openFollowers} className="hover:underline">
                <span className="font-semibold">{profile.followers_count}</span>{' '}
                <span className="text-text-muted">seguidores</span>
              </button>
              <button onClick={openFollowing} className="hover:underline">
                <span className="font-semibold">{profile.following_count}</span>{' '}
                <span className="text-text-muted">siguiendo</span>
              </button>
            </div>
          </div>
          {user && (
            <button
              onClick={following ? handleUnfollow : handleFollow}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                following
                  ? 'bg-bg border border-border text-text-muted hover:text-error hover:border-error'
                  : 'bg-primary hover:bg-primary-hover text-white'
              }`}
            >
              {following ? <><UserMinus size={16} /> Siguiendo</> : <><UserPlus size={16} /> Seguir</>}
            </button>
          )}
        </div>
      </div>

      {(showFollowers || showFollowing) && (
        <div className="bg-surface border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">{showFollowers ? 'Seguidores' : 'Siguiendo'}</h3>
            <button onClick={() => { setShowFollowers(false); setShowFollowing(false) }}
              className="text-xs text-text-muted hover:text-text">Cerrar</button>
          </div>
          <div className="space-y-3">
            {(showFollowers ? followersList : followingList).map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/u/${p.username}`)}>
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white">
                      {p.name?.charAt(0) ?? '?'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-text-muted">@{p.username}</p>
                  </div>
                </div>
              </div>
            ))}
            {(showFollowers ? followersList : followingList).length === 0 && (
              <p className="text-sm text-text-muted text-center py-3">Sin usuarios</p>
            )}
          </div>
        </div>
      )}

      {tabs.length > 0 && (
        <>
          <div className="flex gap-1 border-b border-border mb-6">
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
                <span className="text-xs bg-bg px-1.5 py-0.5 rounded-full">{tab.count}</span>
              </button>
            ))}
          </div>

          {activeTab === 'movies' && privacy?.show_movies !== false && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {movies.map((m) => (
                <div key={m.id} className="bg-surface border border-border rounded-2xl overflow-hidden group hover:border-primary/30 transition-colors">
                  <div className="relative h-44 bg-bg overflow-hidden">
                    {m.poster_url ? (
                      <img src={m.poster_url} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center">
                        <Film size={40} className="text-text-muted/30" />
                      </div>
                    )}
                    <span className={`absolute top-3 left-3 ${m.status === 'completed' ? 'bg-success' : m.status === 'watching' ? 'bg-warning' : 'bg-text-muted'} text-white text-xs font-semibold px-2.5 py-1 rounded-lg`}>
                      {m.status === 'completed' ? 'Vista' : m.status === 'watching' ? 'Viendo' : 'Por ver'}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold truncate">{m.title}</h3>
                    <p className="text-xs text-text-muted mt-0.5">{m.media_type === 'movie' ? 'Película' : 'Serie'}</p>
                    {m.rating && (
                      <div className="flex items-center gap-1 mt-2">
                        <Star size={13} className="text-warning fill-warning" />
                        <span className="text-xs font-medium">{m.rating}/10</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {movies.length === 0 && <p className="text-sm text-text-muted col-span-full text-center py-8">Sin películas</p>}
            </div>
          )}

          {activeTab === 'events' && privacy?.show_events !== false && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {events.map((event) => {
                const [, m, d] = event.event_date.split('-')
                const typeInfo = TYPE_LABELS[event.type] ?? TYPE_LABELS.other
                const isLiked = likedEventIds.has(event.id)
                return (
                  <div key={event.id} className="bg-surface border border-border rounded-2xl overflow-hidden group hover:border-primary/30 transition-colors">
                    <div className="relative h-44 bg-bg overflow-hidden">
                      {event.drive_cover ? (
                        <img src={event.drive_cover} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <CalendarDays size={40} className="text-text-muted/30" />
                        </div>
                      )}
                      <span className={`absolute top-3 left-3 ${typeInfo.color} text-white text-xs font-semibold px-2.5 py-1 rounded-lg`}>
                        {typeInfo.label}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-center shrink-0 bg-bg rounded-xl px-3 py-2">
                          <p className="text-lg font-bold leading-none">{parseInt(d)}</p>
                          <p className="text-[10px] font-semibold text-primary">{MONTHS_SHORT[parseInt(m) - 1]}</p>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold truncate">{event.title}</h3>
                          <div className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
                            <MapPin size={11} />
                            <span className="truncate">{event.venue}, {event.city}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                        <button onClick={() => handleLikeEvent(event.id)}
                          className={`flex items-center gap-1.5 text-sm transition-colors ${isLiked ? 'text-error' : 'text-text-muted hover:text-error'}`}>
                          <Heart size={16} className={isLiked ? 'fill-error' : ''} />
                          <span className="text-xs font-medium">{event.likes_count ?? 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {events.length === 0 && <p className="text-sm text-text-muted col-span-full text-center py-8">Sin eventos</p>}
            </div>
          )}

          {activeTab === 'places' && privacy?.show_places !== false && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {places.map((place) => {
                const isLiked = likedPlaceIds.has(place.id)
                return (
                  <div key={place.id} className="bg-surface border border-border rounded-2xl overflow-hidden group hover:border-primary/30 transition-colors">
                    <div className="relative h-44 bg-bg overflow-hidden">
                      {place.drive_image ? (
                        <img src={place.drive_image} alt={place.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-success/20 to-primary/20 flex items-center justify-center">
                          <MapPin size={40} className="text-text-muted/30" />
                        </div>
                      )}
                      <span className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-lg">
                        {place.country}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold">{place.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-text-muted mt-0.5">
                        <MapPin size={11} />
                        <span>{place.city}, {place.country}</span>
                      </div>
                      {place.rating && (
                        <div className="flex gap-0.5 mt-2">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} size={13} className={n <= place.rating! ? 'text-warning fill-warning' : 'text-text-muted/20'} />
                          ))}
                        </div>
                      )}
                      {place.visited_at && (
                        <p className="text-[11px] text-text-muted mt-1">{new Date(place.visited_at + 'T12:00:00').toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}</p>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <button onClick={() => handleLikePlace(place.id)}
                          className={`flex items-center gap-1.5 text-sm transition-colors ${isLiked ? 'text-error' : 'text-text-muted hover:text-error'}`}>
                          <Heart size={16} className={isLiked ? 'fill-error' : ''} />
                          <span className="text-xs font-medium">{place.likes_count ?? 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {places.length === 0 && <p className="text-sm text-text-muted col-span-full text-center py-8">Sin lugares</p>}
            </div>
          )}

          {activeTab === 'journal' && privacy?.show_journal === true && (
            <div className="space-y-3">
              {journal.map((j) => (
                <div key={j.id} className="bg-surface border border-border rounded-xl px-5 py-4">
                  <p className="text-sm font-medium">{j.title}</p>
                  <p className="text-xs text-text-muted">{j.created_at.split('T')[0]}</p>
                </div>
              ))}
              {journal.length === 0 && <p className="text-sm text-text-muted text-center py-8">Sin entradas</p>}
            </div>
          )}
        </>
      )}
    </div>
  )
}
