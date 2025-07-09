/*
  # Alter resposta_lista foreign key to cascade on delete/update
  1. Modify existing foreign key constraint on 'resposta_lista' table.
  2. Add ON DELETE CASCADE and ON UPDATE CASCADE to 'resposta_lista_alternativa_select_fkey'.
*/

-- Drop the existing foreign key constraint if it exists
ALTER TABLE public.resposta_lista
DROP CONSTRAINT IF EXISTS resposta_lista_alternativa_select_fkey;

-- Add the foreign key constraint back with ON DELETE CASCADE and ON UPDATE CASCADE
ALTER TABLE public.resposta_lista
ADD CONSTRAINT resposta_lista_alternativa_select_fkey
FOREIGN KEY (alternativa_select) REFERENCES public.alternativas(id)
ON DELETE CASCADE ON UPDATE CASCADE;
