-- Crear bucket de avatares
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Política: cualquier usuario autenticado puede subir su propio avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Política: cualquier usuario autenticado puede actualizar su propio avatar
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Política: los avatares son públicos para lectura
CREATE POLICY "Avatars are public" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');
