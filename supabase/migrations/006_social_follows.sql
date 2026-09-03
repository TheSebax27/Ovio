-- Configuración de privacidad por módulo
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.privacy_settings (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  show_finances boolean NOT NULL DEFAULT false,
  show_movies boolean NOT NULL DEFAULT true,
  show_events boolean NOT NULL DEFAULT true,
  show_journal boolean NOT NULL DEFAULT false,
  show_places boolean NOT NULL DEFAULT true
);

ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own privacy" ON public.privacy_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read privacy settings" ON public.privacy_settings
  FOR SELECT USING (true);

-- Follows
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own follows" ON public.follows
  FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Anyone can see follows" ON public.follows
  FOR SELECT USING (true);

-- Contadores de followers/following en profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS followers_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count int NOT NULL DEFAULT 0;

-- Función para actualizar contadores
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
    UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();

-- Políticas para lectura pública de perfiles (para búsqueda y perfiles públicos)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

CREATE POLICY "Anyone can read public profiles" ON public.profiles
  FOR SELECT USING (true);

-- Políticas de lectura pública para módulos (respetando privacidad)
-- Películas
DROP POLICY IF EXISTS "Users manage own movies" ON public.movies;
CREATE POLICY "Users manage own movies" ON public.movies
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can read movies" ON public.movies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      LEFT JOIN public.privacy_settings ps ON ps.user_id = p.id
      WHERE p.id = movies.user_id
        AND p.is_public = true
        AND COALESCE(ps.show_movies, true) = true
    )
  );

-- Eventos
DROP POLICY IF EXISTS "Users manage own events" ON public.events;
CREATE POLICY "Users manage own events" ON public.events
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can read events" ON public.events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      LEFT JOIN public.privacy_settings ps ON ps.user_id = p.id
      WHERE p.id = events.user_id
        AND p.is_public = true
        AND COALESCE(ps.show_events, true) = true
    )
  );

-- Lugares
DROP POLICY IF EXISTS "Users manage own places" ON public.places;
CREATE POLICY "Users manage own places" ON public.places
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can read places" ON public.places
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      LEFT JOIN public.privacy_settings ps ON ps.user_id = p.id
      WHERE p.id = places.user_id
        AND p.is_public = true
        AND COALESCE(ps.show_places, true) = true
    )
  );

-- Finanzas
DROP POLICY IF EXISTS "Users manage own finances" ON public.finances;
CREATE POLICY "Users manage own finances" ON public.finances
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can read finances" ON public.finances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      LEFT JOIN public.privacy_settings ps ON ps.user_id = p.id
      WHERE p.id = finances.user_id
        AND p.is_public = true
        AND COALESCE(ps.show_finances, false) = true
    )
  );

-- Diario
DROP POLICY IF EXISTS "Users manage own journal" ON public.journal;
CREATE POLICY "Users manage own journal" ON public.journal
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can read journal" ON public.journal
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      LEFT JOIN public.privacy_settings ps ON ps.user_id = p.id
      WHERE p.id = journal.user_id
        AND p.is_public = true
        AND COALESCE(ps.show_journal, false) = true
    )
  );

-- Función para buscar usuarios
CREATE OR REPLACE FUNCTION public.search_users(query text, current_user_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  username text,
  name text,
  avatar_url text,
  bio text,
  followers_count int,
  following_count int,
  is_following boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.name,
    p.avatar_url,
    p.bio,
    p.followers_count,
    p.following_count,
    EXISTS(
      SELECT 1 FROM public.follows f
      WHERE f.follower_id = current_user_id AND f.following_id = p.id
    ) AS is_following
  FROM public.profiles p
  WHERE p.is_public = true
    AND p.username IS NOT NULL
    AND p.id != COALESCE(current_user_id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND (
      p.username ILIKE '%' || query || '%'
      OR p.name ILIKE '%' || query || '%'
    )
  ORDER BY p.followers_count DESC
  LIMIT 20;
END;
$$;

-- Función para obtener feed social (actividad de seguidos)
CREATE OR REPLACE FUNCTION public.get_social_feed(current_user_id uuid, feed_limit int DEFAULT 30)
RETURNS TABLE(
  item_type text,
  item_id uuid,
  user_id uuid,
  username text,
  avatar_url text,
  title text,
  subtitle text,
  created_date text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  (
    SELECT 'movie'::text, m.id, m.user_id, p.username, p.avatar_url,
      m.title,
      CASE m.status WHEN 'completed' THEN 'Vista' WHEN 'watching' THEN 'Viendo' ELSE 'Por ver' END
        || CASE WHEN m.rating IS NOT NULL THEN ' · ' || m.rating || '/10' ELSE '' END,
      COALESCE(m.watched_at::text, m.id::text)
    FROM movies m
    JOIN profiles p ON p.id = m.user_id
    LEFT JOIN privacy_settings ps ON ps.user_id = m.user_id
    JOIN follows f ON f.following_id = m.user_id AND f.follower_id = current_user_id
    WHERE COALESCE(ps.show_movies, true) = true
  )
  UNION ALL
  (
    SELECT 'event'::text, e.id, e.user_id, p.username, p.avatar_url,
      e.title,
      CASE e.type WHEN 'concert' THEN 'Concierto' ELSE 'Partido' END || ' · ' || e.city,
      e.event_date::text
    FROM events e
    JOIN profiles p ON p.id = e.user_id
    LEFT JOIN privacy_settings ps ON ps.user_id = e.user_id
    JOIN follows f ON f.following_id = e.user_id AND f.follower_id = current_user_id
    WHERE COALESCE(ps.show_events, true) = true
  )
  UNION ALL
  (
    SELECT 'place'::text, pl.id, pl.user_id, p.username, p.avatar_url,
      pl.name,
      pl.city || ', ' || pl.country
        || CASE WHEN pl.rating IS NOT NULL THEN ' · ' || repeat('★', pl.rating) ELSE '' END,
      COALESCE(pl.visited_at::text, pl.id::text)
    FROM places pl
    JOIN profiles p ON p.id = pl.user_id
    LEFT JOIN privacy_settings ps ON ps.user_id = pl.user_id
    JOIN follows f ON f.following_id = pl.user_id AND f.follower_id = current_user_id
    WHERE COALESCE(ps.show_places, true) = true
  )
  UNION ALL
  (
    SELECT 'journal'::text, j.id, j.user_id, p.username, p.avatar_url,
      j.title,
      'Entrada de diario',
      j.created_at::date::text
    FROM journal j
    JOIN profiles p ON p.id = j.user_id
    LEFT JOIN privacy_settings ps ON ps.user_id = j.user_id
    JOIN follows f ON f.following_id = j.user_id AND f.follower_id = current_user_id
    WHERE COALESCE(ps.show_journal, false) = true
  )
  ORDER BY created_date DESC
  LIMIT feed_limit;
END;
$$;

-- Insertar privacy_settings para usuarios existentes
INSERT INTO public.privacy_settings (user_id)
SELECT id FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.privacy_settings)
ON CONFLICT DO NOTHING;
