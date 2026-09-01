import { Link } from 'react-router-dom'
import ovioLogo from '../../assets/Ovio.png'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <img src={ovioLogo} alt="Ovio" className="w-8 h-8" />
          <span className="text-2xl font-bold text-primary">Ovio</span>
        </div>
        <Link
          to="/login"
          className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          Iniciar sesión
        </Link>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Tu vida, en un<br />
          <span className="text-primary">solo lugar</span>
        </h1>
        <p className="text-text-muted text-lg md:text-xl max-w-xl mb-10">
          Registra tus finanzas, películas, conciertos, lugares y recuerdos.
          Todo en una experiencia moderna y personal.
        </p>
        <Link
          to="/login"
          className="bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-xl text-base font-medium transition-colors"
        >
          Comenzar gratis
        </Link>
      </main>
    </div>
  )
}
