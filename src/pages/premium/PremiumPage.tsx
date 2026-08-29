import { Crown, Check } from 'lucide-react'

const features = [
  'Entradas ilimitadas en todos los módulos',
  'Estadísticas avanzadas',
  'Resumen anual',
  'Temas premium',
  'Álbumes ilimitados',
]

export default function PremiumPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Premium</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-1">Basic</h2>
          <p className="text-3xl font-bold mb-4">Gratis</p>
          <p className="text-sm text-text-muted">Para siempre</p>
        </div>
        <div className="bg-surface border-2 border-primary rounded-xl p-6 relative">
          <Crown size={20} className="absolute top-4 right-4 text-primary" />
          <h2 className="text-lg font-semibold mb-1">Pro</h2>
          <p className="text-3xl font-bold mb-1">$9.900 <span className="text-sm font-normal text-text-muted">COP/mes</span></p>
          <ul className="mt-4 space-y-2">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-text-muted">
                <Check size={16} className="text-success" />
                {f}
              </li>
            ))}
          </ul>
          <button className="w-full mt-6 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
            Próximamente
          </button>
        </div>
      </div>
    </div>
  )
}
