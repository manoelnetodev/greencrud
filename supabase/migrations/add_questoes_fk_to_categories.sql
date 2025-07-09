/*
  # Add foreign key constraints to 'questoes' table
  1. Add foreign key constraint for 'categoria' column referencing 'public.categoria(id)'.
  2. Add foreign key constraint for 'subcategoria' column referencing 'public.subcategoria(id)'.
  3. Add foreign key constraint for 'assunto' column referencing 'public.assunto(id)'.
*/

ALTER TABLE public.questoes
ADD CONSTRAINT questoes_categoria_fkey
FOREIGN KEY (categoria) REFERENCES public.categoria(id);

ALTER TABLE public.questoes
ADD CONSTRAINT questoes_subcategoria_fkey
FOREIGN KEY (subcategoria) REFERENCES public.subcategoria(id);

ALTER TABLE public.questoes
ADD CONSTRAINT questoes_assunto_fkey
FOREIGN KEY (assunto) REFERENCES public.assunto(id);
