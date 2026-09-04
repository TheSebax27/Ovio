# Ovio — CLAUDE.md

## Qué es
SaaS de gestión de vida personal. Cada usuario tiene @username único y registra: finanzas, películas/series, conciertos, partidos, lugares y diario personal.

## Stack
- React 19 + TypeScript + Vite 8
- Tailwind CSS 4 (via @tailwindcss/vite)
- React Router DOM 7
- Supabase (auth con Google, DB, RLS, Storage para avatares)
- Lucide React (iconos)
- xlsx (exportar Excel)
- Google Drive API v3 (imágenes del usuario — carpeta "Ovio" por usuario, scope drive.file, WebP autoconversión)
- Stripe (planes Basic gratis / Pro $9.900 COP/mes)
- TMDB API (búsqueda de películas/series con poster — requiere VITE_TMDB_API_KEY)
- Deploy: Vercel

## Estructura
```
src/
├── components/{ui,layout,modals}/
│   ├── ui/EmptyState.tsx, ConfirmDialog.tsx, ExportButton.tsx, ImageUploader.tsx
│   ├── layout/Sidebar.tsx (responsive), Topbar.tsx (búsqueda global), AppLayout.tsx
│   └── modals/FinanceModal, LoanModal, SavingsGoalModal, FixedExpenseModal, BudgetModal, JournalModal, MovieModal (con TMDB), EventModal, PlaceModal, TaskModal
├── pages/{landing,auth,dashboard,finance,entertainment,events,journal,places,calendar,premium,settings,social}/
│   └── social/SearchUsersPage.tsx, SocialFeedPage.tsx, PublicProfilePage.tsx
├── services/financeService, loanService, savingsService, budgetService, fixedExpenseService, journalService, movieService, eventService, placeService, tmdbService, exportService, socialService, driveService, imageService, taskService, gcalService, likeService
├── context/AuthContext.tsx, ToastContext.tsx
├── routes/AppRouter.tsx
├── types/index.ts
├── lib/supabase.ts
└── assets/Ovio.png
supabase/migrations/
├── 001_initial_schema.sql
├── 002_finance_expanded.sql
├── 003_profiles_insert_policy.sql
├── 004_avatars_bucket.sql
├── 005_username_unique_check.sql
├── 006_social_follows.sql
├── 007_drive_images.sql
├── 008_tasks_planner.sql
└── 009_likes.sql
```

## Convenciones
- Un componente por archivo, export default
- Páginas en `pages/<modulo>/<Modulo>Page.tsx`
- Tipos en `types/index.ts`
- Servicios de Supabase en `services/`
- Colores: usar tokens Tailwind definidos en index.css (@theme): primary, surface, border, text, text-muted, etc.

## Rutas
- `/` Landing, `/login`, `/register` (username)
- `/dashboard`, `/finance`, `/entertainment`, `/events`, `/journal`, `/places`, `/calendar`, `/premium`, `/settings`
- `/social/feed` (feed + buscador de personas integrado), `/u/:username` (perfil público), `/social/search` redirige a feed
- ProtectedRoute redirige a /login si no autenticado, a /register si no tiene username

## Base de datos
Tablas core: profiles (con bio, is_public, followers_count, following_count, gcal_sync), finances, movies, events (likes_count, tipos expandidos), journal, journal_images, places (likes_count, drive_image), tasks, likes, subscriptions
Tablas finanzas: loans, loan_payments, savings_goals, savings_contributions, budgets, fixed_expenses, fixed_expense_payments
Tablas social: follows (follower_id, following_id), privacy_settings (show_finances/movies/events/places/journal por usuario)
RPCs: check_username_available, claim_username (SECURITY DEFINER), search_users, get_social_feed
Storage: bucket "avatars" (público, RLS por carpeta user_id)
Todas con RLS. Trigger auto-crea profile al signup. Trigger update_follow_counts actualiza contadores al follow/unfollow.
Migraciones en supabase/migrations/

## Variables de entorno
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_TMDB_API_KEY=         # opcional, para buscar películas/series
```

## Comandos
- `npm run dev` — servidor de desarrollo
- `npm run build` — build producción
- `npm run lint` — oxlint

## Estado del proyecto
- Sprint 1 (Fundación): COMPLETADO — layout, rutas, auth, design tokens
- Sprint 2 (Módulos): COMPLETADO — Finanzas (6 tabs), Diario, Películas/Series, Eventos, Lugares, Dashboard timeline
- Sprint 3 (UX): COMPLETADO
  - Sidebar responsive (hamburguesa en móvil, overlay)
  - Búsqueda global en Topbar (busca en todos los módulos con debounce)
  - Toast notifications (success/error/info con auto-dismiss)
  - Confirmación de borrado en TODAS las páginas (ConfirmDialog)
  - TMDB integration en MovieModal (autocompletado + póster automático)
  - Frases motivacionales diarias en Dashboard
  - "Un día como hoy" en Dashboard (compara con años anteriores)
  - Gráfico de barras SVG en Resumen de Finanzas (últimos 6 meses)
  - Exportar a Excel en todos los módulos (xlsx)
  - Vista de Calendario (/calendar) — muestra eventos, diario, gastos, deudas fijas
  - Foto de perfil editable en Settings (Supabase Storage bucket "avatars")
- Sprint 4 (Social): EN PROGRESO
  - Sistema de follow/followers con contadores automáticos (trigger)
  - Búsqueda de usuarios (SearchUsersPage con debounce 400ms)
  - Perfiles públicos (/u/:username) con tabs de contenido
  - Feed social (actividad de seguidos, SocialFeedPage)
  - Privacidad por módulo (cada usuario elige qué se ve)
  - Bio editable en Settings + toggles de privacidad
  - Username único con SECURITY DEFINER (bypass RLS)
  - Sidebar actualizado con Feed y Personas
- Sprint 5 (Imágenes): EN PROGRESO
  - Google Drive integration (carpeta "Ovio" por usuario, drive_folder_id en profile)
  - ImageUploader componente global reutilizable
  - Conversión automática a WebP (Canvas API, max 1200px, 82% quality)
  - Integrado en EventModal (drive_cover), PlaceModal (drive_image), JournalModal (drive_image)
  - Token de Drive se captura en login y se guarda en localStorage
  - reconnectDrive() si el token expira (~1 hora)
- Sprint 6 (Planificador): COMPLETADO
  - Tabla tasks con prioridad (low/medium/high), fecha, hora, completed
  - TaskModal para crear/editar tareas
  - Tareas integradas en CalendarPage (se ven como chips de color por prioridad)
  - Panel de día con toggle completar, editar, eliminar tareas
  - Google Calendar sync OPCIONAL (toggle en calendario)
  - gcalService.ts: lee/crea/borra eventos en GCal del usuario
  - gcal_sync flag en profiles controla si está activo
  - Scope calendar agregado al OAuth login
- Sprint 7 (Pendiente): Premium/Free, Stripe, Spotify integration
- Pendiente: Gamificación/logros, Tags/etiquetas, Favoritos
