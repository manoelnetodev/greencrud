import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle, Circle } from 'lucide-react';

// Interfaces para o estado do formulário, permitindo null para campos opcionais
interface AlternativaForm {
  id: number | null; // null para novas alternativas, number para existentes
  alternativa_txt: string;
  correta: boolean;
  comentario: string | null;
  imagens: string[] | null;
}

interface QuestaoForm {
  id: number | null;
  enunciado: string;
  comentario: string | null;
  numero: number | null;
  discursiva: boolean;
  ano: string | null;
  dif_q: string | null;
  foco: string | null;
  assunto: number | null;
  categoria: number | null;
  subcategoria: number | null;
  imagens_enunciado: string[] | null;
  alternativas: AlternativaForm[];
}

interface QuestaoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (questaoData: QuestaoForm) => Promise<void>; // Callback para salvar no pai
  provaId: number;
  institutionId: number; // Necessário para criar/editar a questão
  questao?: QuestaoForm | null; // Questão para edição (opcional)
}

const QuestaoFormModal: React.FC<QuestaoFormModalProps> = ({ isOpen, onClose, onSave, provaId, institutionId, questao }) => {
  const [formData, setFormData] = useState<QuestaoForm>({
    id: null,
    enunciado: '',
    comentario: null,
    numero: null,
    discursiva: false,
    ano: null,
    dif_q: null,
    foco: null,
    assunto: null,
    categoria: null,
    subcategoria: null,
    imagens_enunciado: null,
    alternativas: [],
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [nextAltId, setNextAltId] = useState(-1); // Para IDs temporários de novas alternativas
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (questao) {
        // Preencher formulário com dados da questão existente
        setFormData({
          id: questao.id,
          enunciado: questao.enunciado || '',
          comentario: questao.comentario || null,
          numero: questao.numero,
          discursiva: questao.discursiva,
          ano: questao.ano || null,
          dif_q: questao.dif_q || null,
          foco: questao.foco || null,
          assunto: questao.assunto,
          categoria: questao.categoria,
          subcategoria: questao.subcategoria,
          imagens_enunciado: questao.imagens_enunciado || null,
          alternativas: questao.alternativas.map(alt => ({
            id: alt.id,
            alternativa_txt: alt.alternativa_txt || '',
            comentario: alt.comentario || null,
            correta: alt.correta,
            imagens: alt.imagens || null,
          })),
        });
        // Garantir que o nextAltId seja único e negativo para novas alternativas
        const maxExistingAltId = questao.alternativas.reduce((max, alt) => Math.max(max, alt.id || 0), 0);
        setNextAltId(maxExistingAltId > 0 ? -1 : -1); // Reinicia para -1 para novas
      } else {
        // Resetar formulário para nova questão
        setFormData({
          id: null,
          enunciado: '',
          comentario: null,
          numero: null,
          discursiva: false,
          ano: null,
          dif_q: null,
          foco: null,
          assunto: null,
          categoria: null,
          subcategoria: null,
          imagens_enunciado: null,
          alternativas: [],
        });
        setNextAltId(-1);
      }
      setErrors({});
      setIsSaving(false);
    }
  }, [isOpen, questao]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? null : Number(value)) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleAlternativeChange = (index: number, field: keyof AlternativaForm, value: any) => {
    const newAlternatives = [...formData.alternativas];
    newAlternatives[index] = { ...newAlternatives[index], [field]: value };
    setFormData(prev => ({ ...prev, alternativas: newAlternatives }));
  };

  const handleCorrectAlternativeChange = (index: number) => {
    const newAlternatives = formData.alternativas.map((alt, i) => ({
      ...alt,
      correta: i === index,
    }));
    setFormData(prev => ({ ...prev, alternativas: newAlternatives }));
  };

  const handleAddAlternative = () => {
    setFormData(prev => ({
      ...prev,
      alternativas: [
        ...prev.alternativas,
        { id: nextAltId, alternativa_txt: '', correta: false, comentario: null, imagens: null },
      ],
    }));
    setNextAltId(prev => prev - 1);
  };

  const handleRemoveAlternative = (index: number) => {
    const newAlternatives = formData.alternativas.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, alternativas: newAlternatives }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.enunciado.trim()) {
      newErrors.enunciado = 'O enunciado da questão é obrigatório.';
    }
    if (!formData.discursiva) { // Apenas para questões objetivas
      if (formData.alternativas.length < 2) {
        newErrors.alternativas = 'Para questões objetivas, são necessárias pelo menos duas alternativas.';
      }
      if (!formData.alternativas.some(alt => alt.correta)) {
        newErrors.correta = 'Para questões objetivas, uma alternativa correta deve ser selecionada.';
      }
      if (formData.alternativas.some(alt => !alt.alternativa_txt.trim())) {
        newErrors.alternativas = 'Todas as alternativas devem ter texto.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSaving(true);
    try {
      await onSave({ ...formData, prova: provaId, instituicao: institutionId } as QuestaoForm); // Pass provaId and institutionId
      onClose(); // Fechar modal após salvar
    } catch (err: any) {
      // Erro já tratado no componente pai (QuestaoEditor)
      console.error("Erro ao salvar questão no modal:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto transform scale-95 animate-scale-in border border-border">
        <div className="flex justify-between items-center p-6 border-b border-border/50">
          <h2 className="text-2xl font-bold text-text">{questao ? 'Editar Questão' : 'Nova Questão'}</h2>
          <button
            onClick={() => onClose()}
            className="p-2 rounded-full text-textSecondary hover:bg-background hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface"
            aria-label="Fechar modal"
            disabled={isSaving}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="enunciado" className="block text-sm font-medium text-textSecondary mb-2">
              Enunciado da Questão <span className="text-error">*</span>
            </label>
            <textarea
              id="enunciado"
              name="enunciado"
              value={formData.enunciado}
              onChange={handleChange}
              rows={5}
              className="w-full p-3 bg-background border border-border rounded-lg text-text placeholder-textSecondary focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ease-in-out resize-y"
              placeholder="Digite o enunciado completo da questão..."
              required
              disabled={isSaving}
            />
            {errors.enunciado && <p className="text-error text-sm mt-1">{errors.enunciado}</p>}
          </div>

          <div>
            <label htmlFor="comentario" className="block text-sm font-medium text-textSecondary mb-2">
              Comentário da Questão (Opcional)
            </label>
            <textarea
              id="comentario"
              name="comentario"
              value={formData.comentario || ''}
              onChange={handleChange}
              rows={3}
              className="w-full p-3 bg-background border border-border rounded-lg text-text placeholder-textSecondary focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ease-in-out resize-y"
              placeholder="Adicione um comentário ou explicação sobre a questão..."
              disabled={isSaving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="numero" className="block text-sm font-medium text-textSecondary mb-2">
                Número da Questão (Opcional)
              </label>
              <input
                type="number"
                id="numero"
                name="numero"
                value={formData.numero === null ? '' : formData.numero}
                onChange={handleChange}
                className="w-full p-3 bg-background border border-border rounded-lg text-text placeholder-textSecondary focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ease-in-out"
                placeholder="Ex: 1, 2, 3..."
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center mt-6 sm:mt-0">
              <input
                type="checkbox"
                id="discursiva"
                name="discursiva"
                checked={formData.discursiva}
                onChange={handleCheckboxChange}
                className="h-5 w-5 text-primary rounded border-border bg-background focus:ring-primary cursor-pointer"
                disabled={isSaving}
              />
              <label htmlFor="discursiva" className="ml-2 text-sm font-medium text-text">
                Questão Discursiva
              </label>
            </div>
          </div>

          {!formData.discursiva && (
            <div className="space-y-4 border border-border/70 rounded-lg p-4 bg-background">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-text">Alternativas <span className="text-error">*</span></h3>
                <button
                  type="button"
                  onClick={handleAddAlternative}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-1"
                  disabled={isSaving}
                >
                  <Plus className="w-4 h-4" /> Adicionar Alternativa
                </button>
              </div>
              {errors.alternativas && <p className="text-error text-sm mt-1">{errors.alternativas}</p>}
              {errors.correta && <p className="text-error text-sm mt-1">{errors.correta}</p>}

              {formData.alternativas.length === 0 && (
                <p className="text-textSecondary italic text-sm">Adicione pelo menos duas alternativas para questões objetivas.</p>
              )}

              <div className="space-y-3">
                {formData.alternativas.map((alt, index) => (
                  <div key={alt.id || `new-${index}`} className="flex items-start gap-3 p-3 bg-surface rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() => handleCorrectAlternativeChange(index)}
                      className="flex-shrink-0 p-1 rounded-full text-textSecondary hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface"
                      aria-label={alt.correta ? 'Alternativa correta' : 'Marcar como correta'}
                      disabled={isSaving}
                    >
                      {alt.correta ? (
                        <CheckCircle className="w-6 h-6 text-success" />
                      ) : (
                        <Circle className="w-6 h-6 text-textSecondary" />
                      )}
                    </button>
                    <div className="flex-grow">
                      <input
                        type="text"
                        value={alt.alternativa_txt}
                        onChange={(e) => handleAlternativeChange(index, 'alternativa_txt', e.target.value)}
                        className="w-full p-2 bg-background border border-border rounded-lg text-text placeholder-textSecondary focus:ring-1 focus:ring-primary focus:border-transparent text-sm"
                        placeholder={`Texto da alternativa ${index + 1}`}
                        required
                        disabled={isSaving}
                      />
                      <input
                        type="text"
                        value={alt.comentario || ''}
                        onChange={(e) => handleAlternativeChange(index, 'comentario', e.target.value)}
                        className="w-full mt-2 p-2 bg-background border border-border rounded-lg text-text placeholder-textSecondary focus:ring-1 focus:ring-primary focus:border-transparent text-sm"
                        placeholder={`Comentário da alternativa ${index + 1} (opcional)`}
                        disabled={isSaving}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAlternative(index)}
                      className="flex-shrink-0 p-2 rounded-full text-textSecondary hover:bg-error/20 hover:text-error transition-colors focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2 focus:ring-offset-surface"
                      aria-label="Remover alternativa"
                      disabled={isSaving}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4 border-t border-border/50">
            <button
              type="button"
              onClick={() => onClose()}
              className="px-6 py-3 rounded-lg font-semibold text-textSecondary border border-border hover:bg-surface/80 hover:text-text transition-colors shadow-md"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md flex items-center justify-center gap-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                questao ? 'Salvar Alterações' : 'Criar Questão'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestaoFormModal;
