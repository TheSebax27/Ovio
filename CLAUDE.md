# Ovio — CLAUDE.md

## Qué es
SaaS de gestión de vida personal. Cada usuario tiene @username único y registra: finanzas, películas/series, conciertos, partidos, lugares y diario personal.

## Stack
- React 19 + TypeScript + Vite 8
- Tailwind CSS 4 (via @tailwindcss/vite)
- React Router DOM 7
- Supabase (auth con Google, DB, RLS)
- Lucide React (iconos)
- Google Drive (imágenes del usuario, NO Supabase Storage)
- Stripe (planes Basic gratis / Pro $9.900 COP/mes)
- Deploy: Vercel

## Estructura
```
src/
├── components/{ui,layout,forms,cards,charts,modals}/
├── pages/{landing,auth,dashboard,finance,entertainment,events,journal,places,premium,settings}/
├── hooks/
├── services/
├── lib/supabase.ts
├── context/AuthContext.tsx
├── routes/AppRouter.tsx
├── types/index.ts
└── utils/
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_finance_expanded.sql
```

## Convenciones
- Un componente por archivo, export default
- Páginas en `pages/<modulo>/<Modulo>Page.tsx`
- Tipos en `types/index.ts`
- Servicios de Supabase en `services/`
- Hooks custom en `hooks/`
- Colores: usar tokens Tailwind definidos en index.css (@theme): primary, surface, border, text, text-muted, etc.

## Rutas
- `/` Landing, `/login`, `/register` (username)
- `/dashboard`, `/finance`, `/entertainment`, `/events`, `/journal`, `/places`, `/premium`, `/settings`
- ProtectedRoute redirige a /login si no autenticado, a /register si no tiene username

## Base de datos
Tablas core: profiles, finances, movies, events, journal, journal_images, places, subscriptions
Tablas finanzas: loans, loan_payments, savings_goals, savings_contributions, budgets, fixed_expenses, fixed_expense_payments
Todas con RLS. Trigger auto-crea profile al signup.
Migraciones en supabase/migrations/

## Variables de entorno
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Comandos
- `npm run dev` — servidor de desarrollo
- `npm run build` — build producción
- `npm run lint` — oxlint

## Estado del proyecto
- Sprint 1 (Fundación): COMPLETADO — layout, rutas, auth context, páginas placeholder, migración SQL, design tokens
- Sprint 2 (Finanzas, Diario, Películas): EN PROGRESO — Finanzas completo (movimientos, préstamos con abonos, metas de ahorro, presupuestos, deudas fijas, resumen mensual)
- Sprint 3 (Eventos, Lugares, Google Drive): PENDIENTE
- Sprint 4 (Stripe, Premium, Estadísticas): PENDIENTE
