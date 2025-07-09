import React from 'react';
import { Type, MinusCircle, Info } from 'lucide-react';
import { Questao, QuestaoFormData } from '../../types'; // Import QuestaoFormData

interface QuestaoNavigationPanelProps {
  questoes: Questao[];
  activeQuestaoId: number | null;
  isEditingActiveQuestao: boolean;
  editingFormData: QuestaoFormData | null; // Add editingFormData to props
  scrollToQuestao: (id: number) => void;
}

const QuestaoNavigationPanel: React.FC<QuestaoNavigationPanelProps> = ({
  questoes,
  activeQuestaoId,
  isEditingActiveQuestao,
  editingFormData, // Destructure editingFormData
  scrollToQuestao,
}) => {
  return (
    <div className="hidden lg:block w-64 flex-shrink-0 sticky top-24 p-4 bg-surface border border-border rounded-xl shadow-lg">
      <h4 className="text-lg font-bold text-text mb-4">Navegação Rápida</h4>
      {questoes.length === 0 ? (
        <p className="text-textSecondary text-sm">Adicione questões para navegar.</p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {questoes.map((q) => (
            <button
              key={q.id}
              onClick={() => scrollToQuestao(q.id)}
              className={`relative w-12 h-12 flex flex-col items-center justify-center rounded-lg font-semibold text-xs transition-colors duration-200 ease-in-out
                ${(activeQuestaoId === q.id && !isEditingActiveQuestao) || (isEditingActiveQuestao && editingFormData?.id === q.id) ? 'bg-primary text-white shadow-md' : 'bg-background text-textSecondary hover:bg-border hover:text-text'}`}
              aria-label={`Ir para questão ${q.numero || q.id}`}
              disabled={isEditingActiveQuestao}
            >
              <span className="text-sm">{q.numero || q.id}</span>
              {q.discursiva && (
                  <span className="absolute top-0 left-0 p-0.5 rounded-full bg-surface">
                      <Type className="w-4 h-4 text-error" title="Questão Discursiva" />
                  </span>
              )}
              {q.anulada && (
                  <span className="absolute top-0 right-0 p-0.5 rounded-full bg-surface">
                      <MinusCircle className="w-4 h-4 text-error" title="Questão Anulada" />
                  </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestaoNavigationPanel;
