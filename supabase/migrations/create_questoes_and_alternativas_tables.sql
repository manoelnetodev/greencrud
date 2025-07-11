/*
  # Create questoes and alternativas tables
  1. New Tables: questoes, alternativas
  2. Functions: update_updated_at_column (for 'updated_at' timestamp)
  3. Triggers: set_updated_at (on questoes table)
  4. Security: Enable RLS for both tables, add policies for authenticated users
     - SELECT: All authenticated users can read.
     - INSERT/UPDATE/DELETE: Authenticated users can modify if the parent 'prova' is NOT blocked.
*/

-- Function to update 'updated_at' column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create questoes table
CREATE TABLE IF NOT EXISTS public.questoes (
  id bigint generated by default as identity not null, -- Using generated by default as identity for simplicity, assuming it's not a pre-defined ID
  created_at timestamp with time zone not null default now(),
  enunciado text null,
  "alternativa_Correta" bigint null,
  ano text null, -- Assuming public.ano is a text type or will be created as an enum separately
  anulada boolean null,
  assunto bigint null,
  categoria bigint null,
  subcategoria bigint null,
  comentario text null,
  dif_q text null, -- Assuming public.dif_q is a text type or will be created as an enum separately
  discursiva boolean null,
  foco text null, -- Assuming public.tipo_de_foco is a text type or will be created as an enum separately
  imagens_enunciado text[] null,
  numero bigint null,
  percentual_acertos numeric null,
  prova bigint not null, -- Must be linked to a prova
  instituicao bigint not null, -- Must be linked to an instituicao
  comentario_validado boolean null,
  updated_at timestamp with time zone null default now(),
  constraint questoes_pkey primary key (id),
  constraint questoes_instituicao_fkey foreign key (instituicao) references public.instituicoes (id) ON DELETE CASCADE,
  constraint questoes_prova_fkey foreign key (prova) references public.provas (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_questoes_assunto ON public.questoes USING btree (assunto) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_questoes_prova ON public.questoes USING btree (prova) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_questoes_instituicao ON public.questoes USING btree (instituicao) TABLESPACE pg_default;

-- Add trigger for updated_at column
DROP TRIGGER IF EXISTS set_updated_at ON public.questoes;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.questoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security for questoes
ALTER TABLE public.questoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for questoes
DROP POLICY IF EXISTS "Questoes: Allow authenticated read access" ON public.questoes;
CREATE POLICY "Questoes: Allow authenticated read access" ON public.questoes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Questoes: Allow authenticated insert if prova not blocked" ON public.questoes;
CREATE POLICY "Questoes: Allow authenticated insert if prova not blocked" ON public.questoes FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.provas WHERE public.provas.id = questoes.prova AND public.provas.bloqueada = false)
);

DROP POLICY IF EXISTS "Questoes: Allow authenticated update if prova not blocked" ON public.questoes;
CREATE POLICY "Questoes: Allow authenticated update if prova not blocked" ON public.questoes FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.provas WHERE public.provas.id = questoes.prova AND public.provas.bloqueada = false)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.provas WHERE public.provas.id = questoes.prova AND public.provas.bloqueada = false)
);

DROP POLICY IF EXISTS "Questoes: Allow authenticated delete if prova not blocked" ON public.questoes;
CREATE POLICY "Questoes: Allow authenticated delete if prova not blocked" ON public.questoes FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.provas WHERE public.provas.id = questoes.prova AND public.provas.bloqueada = false)
);


-- Create alternativas table
CREATE TABLE IF NOT EXISTS public.alternativas (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  alternativa_txt text null,
  comentario text null,
  correta boolean null,
  imagens text[] null,
  questao bigint not null, -- Must be linked to a questao
  comentario_validado boolean null,
  constraint alternativas_pkey primary key (id),
  constraint alternativas_questao_fkey foreign key (questao) references public.questoes (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Add index for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_alternativas_questao ON public.alternativas USING btree (questao) TABLESPACE pg_default;

-- Enable Row Level Security for alternativas
ALTER TABLE public.alternativas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alternativas
DROP POLICY IF EXISTS "Alternativas: Allow authenticated read access" ON public.alternativas;
CREATE POLICY "Alternativas: Allow authenticated read access" ON public.alternativas FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Alternativas: Allow authenticated insert if parent prova not blocked" ON public.alternativas;
CREATE POLICY "Alternativas: Allow authenticated insert if parent prova not blocked" ON public.alternativas FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.questoes q
    JOIN public.provas p ON q.prova = p.id
    WHERE q.id = alternativas.questao AND p.bloqueada = false
  )
);

DROP POLICY IF EXISTS "Alternativas: Allow authenticated update if parent prova not blocked" ON public.alternativas;
CREATE POLICY "Alternativas: Allow authenticated update if parent prova not blocked" ON public.alternativas FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.questoes q
    JOIN public.provas p ON q.prova = p.id
    WHERE q.id = alternativas.questao AND p.bloqueada = false
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.questoes q
    JOIN public.provas p ON q.prova = p.id
    WHERE q.id = alternativas.questao AND p.bloqueada = false
  )
);

DROP POLICY IF EXISTS "Alternativas: Allow authenticated delete if parent prova not blocked" ON public.alternativas;
CREATE POLICY "Alternativas: Allow authenticated delete if parent prova not blocked" ON public.alternativas FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.questoes q
    JOIN public.provas p ON q.prova = p.id
    WHERE q.id = alternativas.questao AND p.bloqueada = false
  )
);
