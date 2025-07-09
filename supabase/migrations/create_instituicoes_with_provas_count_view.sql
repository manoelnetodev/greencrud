/*
  # Create view for institutions with provas count
  1. New Views: instituicoes_with_provas_count (all instituicoes columns + provas_count)
  2. Joins: instituicoes LEFT JOIN provas
*/
CREATE OR REPLACE VIEW public.instituicoes_with_provas_count AS
SELECT
  i.id,
  i.created_at,
  i.nome,
  i.nome_g,
  i.uf,
  i.desabilitada,
  COUNT(p.id) AS provas_count
FROM
  public.instituicoes AS i
LEFT JOIN
  public.provas AS p ON i.id = p.instituicao
GROUP BY
  i.id, i.created_at, i.nome, i.nome_g, i.uf, i.desabilitada;
