-- Columnas de imagen (Google Drive) para places y journal
ALTER TABLE public.places ADD COLUMN IF NOT EXISTS drive_image text;
ALTER TABLE public.journal ADD COLUMN IF NOT EXISTS drive_image text;
