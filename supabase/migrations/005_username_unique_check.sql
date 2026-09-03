-- Función SECURITY DEFINER para verificar disponibilidad de username
-- Bypasea RLS para poder leer todos los perfiles
CREATE OR REPLACE FUNCTION public.check_username_available(target_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE username_lower = lower(target_username)
  );
END;
$$;

-- Asegurar que el constraint UNIQUE existe (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'profiles' AND indexname = 'profiles_username_lower_key'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_lower_key UNIQUE (username_lower);
  END IF;
END $$;

-- Función SECURITY DEFINER para registrar username de forma atómica
-- Verifica disponibilidad + actualiza en una sola transacción
CREATE OR REPLACE FUNCTION public.claim_username(user_id uuid, new_username text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lower_name text := lower(new_username);
  result json;
BEGIN
  -- Verificar que no esté tomado
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username_lower = lower_name AND id != user_id) THEN
    RETURN json_build_object('success', false, 'error', 'Username ya está en uso');
  END IF;

  -- Verificar que el perfil existe
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    UPDATE public.profiles
    SET username = new_username, username_lower = lower_name
    WHERE id = user_id;
  ELSE
    INSERT INTO public.profiles (id, email, name, avatar_url, username, username_lower)
    VALUES (
      user_id,
      (SELECT email FROM auth.users WHERE id = user_id),
      (SELECT coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', '') FROM auth.users WHERE id = user_id),
      (SELECT coalesce(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture', '') FROM auth.users WHERE id = user_id),
      new_username,
      lower_name
    );
  END IF;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'Username ya está en uso');
END;
$$;
