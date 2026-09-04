CREATE TABLE IF NOT EXISTS public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('event', 'place')),
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own likes" ON public.likes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read likes" ON public.likes
  FOR SELECT USING (true);

-- Contadores de likes en events y places
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS likes_count int NOT NULL DEFAULT 0;
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS likes_count int NOT NULL DEFAULT 0;

-- Expandir tipos de eventos
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_type_check;
ALTER TABLE public.events ADD CONSTRAINT events_type_check
  CHECK (type IN ('concert', 'match', 'festival', 'gastro', 'tech', 'sports', 'art', 'theater', 'networking', 'other'));

-- Trigger para actualizar contadores
CREATE OR REPLACE FUNCTION public.update_like_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'event' THEN
      UPDATE events SET likes_count = likes_count + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'place' THEN
      UPDATE places SET likes_count = likes_count + 1 WHERE id = NEW.target_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'event' THEN
      UPDATE events SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'place' THEN
      UPDATE places SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.target_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS on_like_change ON public.likes;
CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.update_like_counts();
