/*
  # Update tipo_de_foco enum
  1. Add new values to the existing tipo_de_foco enum type.
*/

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.tipo_de_foco'::regtype AND enumlabel = 'R1') THEN
        ALTER TYPE public.tipo_de_foco ADD VALUE 'R1';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.tipo_de_foco'::regtype AND enumlabel = 'R+ CIRURGIA GERAL') THEN
        ALTER TYPE public.tipo_de_foco ADD VALUE 'R+ CIRURGIA GERAL';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.tipo_de_foco'::regtype AND enumlabel = 'R+ CLÍNICA MÉDICA') THEN
        ALTER TYPE public.tipo_de_foco ADD VALUE 'R+ CLÍNICA MÉDICA';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.tipo_de_foco'::regtype AND enumlabel = 'R+ GINECOLOGIA E OBSTETRÍCIA') THEN
        ALTER TYPE public.tipo_de_foco ADD VALUE 'R+ GINECOLOGIA E OBSTETRÍCIA';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.tipo_de_foco'::regtype AND enumlabel = 'R+ PEDIATRIA') THEN
        ALTER TYPE public.tipo_de_foco ADD VALUE 'R+ PEDIATRIA';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.tipo_de_foco'::regtype AND enumlabel = 'PROVA PRÁTICA') THEN
        ALTER TYPE public.tipo_de_foco ADD VALUE 'PROVA PRÁTICA';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.tipo_de_foco'::regtype AND enumlabel = 'PROVA TEÓRICA') THEN
        ALTER TYPE public.tipo_de_foco ADD VALUE 'PROVA TEÓRICA';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'public.tipo_de_foco'::regtype AND enumlabel = 'PROVA COMPLEMENTAR') THEN
        ALTER TYPE public.tipo_de_foco ADD VALUE 'PROVA COMPLEMENTAR';
    END IF;
END $$;

-- Add RLS policy for INSERT on provas table (if not already present or needs adjustment)
-- This policy was already created in create_provas_table.sql, ensuring authenticated users can insert.
-- No changes needed here unless specific conditions are required for insertion.
-- CREATE POLICY "Authenticated users can insert provas"
-- ON public.provas FOR INSERT TO authenticated
-- WITH CHECK (true);
