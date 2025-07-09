/*
  # Remove foreign key constraint from resposta_lista
  1. Drop the foreign key constraint "resposta_lista_alternativa_select_fkey" from the "resposta_lista" table.
*/

ALTER TABLE public.resposta_lista
DROP CONSTRAINT IF EXISTS resposta_lista_alternativa_select_fkey;
