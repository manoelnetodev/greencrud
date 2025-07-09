/*
  # Add 'BRASIL' to UF enum
  1. Type Alteration: Add 'BRASIL' value to public.UF enum.
*/
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.UF'::regtype AND enumlabel = 'BRASIL') THEN
        ALTER TYPE public.UF ADD VALUE 'BRASIL';
    END IF;
END
$$;
