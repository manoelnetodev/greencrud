// src/types/index.ts

export interface Alternativa {
  id: number;
  created_at: string;
  alternativa_txt: string | null;
  comentario: string | null;
  correta: boolean | null;
  imagens: string[] | null;
  questao: number;
  comentario_validado: boolean | null;
}

export interface Questao {
  id: number;
  created_at: string;
  enunciado: string | null;
  alternativa_Correta: number | null;
  ano: string | null;
  anulada: boolean | null;
  assunto: number | null;
  categoria: number | null;
  subcategoria: number | null;
  comentario: string | null;
  dif_q: string | null;
  discursiva: boolean | null;
  foco: string | null;
  imagens_enunciado: string[] | null;
  numero: number | null;
  percentual_acertos: number | null;
  prova: number;
  instituicao: number;
  comentario_validado: boolean | null;
  updated_at: string | null;
  alternativas?: Alternativa[];
}

export interface Prova {
  id: number;
  nome: string;
  ano: number;
}

export interface Categoria {
  id: number;
  nome: string;
  abrev: string | null;
  cor_background: string | null;
}

export interface Subcategoria {
  id: number;
  nome: string;
  categoria: number;
}

export interface Assunto {
  id: number;
  nome: string;
  categoria: number;
  subcategoria: number;
  tempo_de_aula: number | null;
}

export interface AlternativaForm {
  id: number | null;
  alternativa_txt: string;
  correta: boolean;
  comentario: string | null;
  imagens: string[] | null;
  newFiles?: File[];
  removedUrls?: string[];
}

export interface QuestaoFormData {
  id: number | null;
  enunciado: string;
  comentario: string | null;
  numero: number | null;
  discursiva: boolean;
  anulada: boolean;
  ano: string | null;
  dif_q: string | null;
  foco: string | null;
  assunto: number | null;
  categoria: number | null;
  subcategoria: number | null;
  imagens_enunciado: string[] | null;
  newEnunciadoFiles?: File[];
  removedEnunciadoUrls?: string[];
  alternativas: AlternativaForm[];
}

export interface QuestaoFormProps {
  editingFormData: QuestaoFormData;
  setEditingFormData: React.Dispatch<React.SetStateAction<QuestaoFormData | null>>;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  loading: boolean;
  errors: { [key: string]: string };
  copyFeedback: string | null;
  handleCopyId: (id: number | null) => void;

  // Taxonomy data and handlers
  allCategories: Categoria[];
  filteredSubcategories: Subcategoria[];
  filteredAssuntos: Assunto[];
  loadingCategories: boolean;
  loadingSubcategories: boolean;
  loadingAssuntos: boolean;
  categoryError: string | null;
  subcategoryError: string | null;
  assuntoError: string | null;
  handleSelectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;

  // Form field handlers
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Alternative handlers
  handleAlternativeChange: (index: number, field: keyof AlternativaForm, value: any) => void;
  handleCorrectAlternativeChange: (index: number) => void;
  handleAddAlternative: () => void;
  handleRemoveAlternativeUrl: (index: number, urlToRemove: string) => void;
  handleRemoveNewAlternativeFile: (altIndex: number, fileToRemove: File) => void;
  handleRemoveAlternative: (index: number) => void;
  isConfirmDeleteAlternativeModalOpen: boolean;
  alternativeToDeleteInfo: { index: number; id: number | null; text: string } | null;
  setIsConfirmDeleteAlternativeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleConfirmDeleteAlternative: () => void;

  // Image handlers
  handleEnunciadoImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveEnunciadoUrl: (urlToRemove: string) => void;
  handleRemoveNewEnunciadoFile: (fileToRemove: File) => void;
  handleAlternativeImageChange: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
}
