export const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO', 'BRASIL'
] as const;

export const TIPO_DE_FOCO_OPTIONS = [
  'R1', 'R+ CIRURGIA GERAL', 'R+ CLÍNICA MÉDICA',
  'R+ GINECOLOGIA E OBSTETRÍCIA', 'R+ PEDIATRIA',
  'PROVA PRÁTICA', 'PROVA TEÓRICA', 'PROVA COMPLEMENTAR'
] as const;

export type UF = typeof UF_OPTIONS[number];
export type TipoDeFoco = typeof TIPO_DE_FOCO_OPTIONS[number];

export const YEAR_OPTIONS = Array.from({ length: 2026 - 2018 + 1 }, (_, i) => 2018 + i);
