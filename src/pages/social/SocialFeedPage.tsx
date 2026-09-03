import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Film, CalendarDays, MapPin, BookOpen, Rss } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getSocialFeed } from '../../services/socialService'
import EmptyState from '../../components/ui/EmptyState'
import type { SocialFeedItem } from '../../types'

const ICON_MAP = {
  movie: { icon: Film, color: 'bg-primary/10', textColor: 'text-primary' },
  event: { icon: CalendarDays, color: 'bg-secondary/10', textColor: 'text-secondary' },
  place: { icon: MapPin, color: 'bg-success/10', textColor: 'text-success' },
  journal: { icon: BookOpen, color: 'bg-warning/10', textColor: 'text-warning' },
}

export default function SocialFeedPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [feed, setFeed] = useState<SocialFeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getSocialFeed(user.id).then((data) => { setFeed(data); setLoading(false) })
  }, [user])

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Feed social</h1>
      </div>

      {feed.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl">
          <EmptyState
            icon={Rss}
            title="Tu feed está vacío"
            description="Sigue a personas para ver su actividad aquí"
            action={
              <button onClick={() => navigate('/social/search')}
                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Buscar personas
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {feed.map((item) => {
            const { icon: Icon, color, textColor } = ICON_MAP[item.item_type]
            return (
              <div key={`${item.item_type}-${item.item_id}`}
                className="bg-surface border border-border rounded-xl px-5 py-4 hover:bg-surface-hover transition-colors">
                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center gap-2 cursor-pointer shrink-0"
                    onClick={() => navigate(`/u/${item.username}`)}
                  >
                    {item.avatar_url ? (
                      <img src={item.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white">
                        {item.username?.charAt(0) ?? '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium cursor-pointer hover:underline"
                        onClick={() => navigate(`/u/${item.username}`)}>
                        @{item.username}
                      </span>
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${color}`}>
                        <Icon size={12} className={textColor} />
                      </div>
                      <span className="text-xs text-text-muted">{item.created_date}</span>
                    </div>
                    <p className="text-sm">{item.title}</p>
                    <p className="text-xs text-text-muted">{item.subtitle}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
