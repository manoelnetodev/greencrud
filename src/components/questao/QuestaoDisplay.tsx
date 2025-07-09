import React from 'react';
import { Edit, Trash2, CheckCircle, XCircle, Type, MinusCircle, Copy, Info } from 'lucide-react';
import { Questao, Categoria, Subcategoria, Assunto } from '../../types';

interface QuestaoDisplayProps {
  activeQuestao: Questao | null;
  categoryMap: Map<number, string>;
  subcategoryMap: Map<number, string>;
  assuntoMap: Map<number, string>;
  onEdit: (questao: Questao) => void;
  onDelete: (questao: Questao) => void;
  handleCopyId: (id: number | null) => void;
  copyFeedback: string | null;
}

const QuestaoDisplay: React.FC<QuestaoDisplayProps> = ({
  activeQuestao,
  categoryMap,
  subcategoryMap,
  assuntoMap,
  onEdit,
  onDelete,
  handleCopyId,
  copyFeedback,
}) => {
  if (!activeQuestao) {
    return (
      <div className="text-center text-textSecondary p-12 bg-surface rounded-xl shadow-lg flex flex-col items-center justify-center">
        <Info className="w-16 h-16 text-primary mb-6 opacity-70" />
        <p className="text-xl font-medium mb-2">Selecione uma questão.</p>
        <p className="text-md">Use o painel de navegação à direita para escolher uma questão.</p>
      </div>
    );
  }

  return (
    <div key={activeQuestao.id} id={`questao-${activeQuestao.id}`} className="bg-surface border border-border rounded-xl p-6 shadow-md animate-fade-in">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-text">
          Questão {activeQuestao.numero || activeQuestao.id}{' '}
          <span
            className="text-textSecondary text-sm font-normal ml-2 cursor-pointer hover:underline relative"
            onClick={() => handleCopyId(activeQuestao.id)}
            title="Clique para copiar o ID"
          >
            (ID: {activeQuestao.id})
            {copyFeedback && (
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-2 py-1 rounded-md whitespace-nowrap animate-fade-in">
                {copyFeedback}
              </span>
            )}
          </span>
        </h3>
        <div className="flex gap-2">
          {activeQuestao.discursiva && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
              <Type className="w-4 h-4" /> Discursiva
            </span>
          )}
          {activeQuestao.anulada && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-accent/20 text-accent">
              <MinusCircle className="w-4 h-4" /> Anulada
            </span>
          )}
          <button
            onClick={() => onEdit(activeQuestao)}
            className="p-2 rounded-full text-textSecondary hover:bg-primary/20 hover:text-primary transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface transform hover:scale-110"
            aria-label="Editar questão"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(activeQuestao)}
            className="p-2 rounded-full text-textSecondary hover:bg-error/20 hover:text-error transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2 focus:ring-offset-surface transform hover:scale-110"
            aria-label="Deletar questão"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="prose prose-invert max-w-none text-textSecondary mb-4">
        <p className="text-lg font-medium text-text">{activeQuestao.enunciado}</p>
        {/* Exibir imagens do enunciado */}
        {activeQuestao.imagens_enunciado && activeQuestao.imagens_enunciado.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeQuestao.imagens_enunciado.map((url, idx) => (
              <img key={idx} src={url} alt={`Imagem do enunciado ${idx}`} className="max-w-full h-auto rounded-lg shadow-md" />
            ))}
          </div>
        )}
        {/* Exibir Categoria, Subcategoria, Assunto */}
        <div className="mt-4 text-sm text-textSecondary space-y-1">
          {activeQuestao.categoria || activeQuestao.subcategoria || activeQuestao.assunto ? (
            <>
              {activeQuestao.categoria && categoryMap.get(activeQuestao.categoria) && (
                <p>
                  <span className="font-semibold text-text">Categoria:</span> {categoryMap.get(activeQuestao.categoria)}
                </p>
              )}
              {activeQuestao.subcategoria && subcategoryMap.get(activeQuestao.subcategoria) && (
                <p>
                  <span className="font-semibold text-text">Subcategoria:</span> {subcategoryMap.get(activeQuestao.subcategoria)}
                </p>
              )}
              {activeQuestao.assunto && assuntoMap.get(activeQuestao.assunto) && (
                <p>
                  <span className="font-semibold text-text">Assunto:</span> {assuntoMap.get(activeQuestao.assunto)}
                </p>
              )}
            </>
          ) : (
            <p className="italic">Questão não classificada.</p>
          )}
        </div>
      </div>

      {!activeQuestao.discursiva && (
        <>
          <h4 className="text-lg font-semibold text-text mb-3">Alternativas:</h4>
          <div className="space-y-3">
            {activeQuestao.alternativas && activeQuestao.alternativas.length > 0 ? (
              activeQuestao.alternativas.map((alt) => (
                <div
                  key={alt.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    alt.id === activeQuestao.alternativa_Correta ? 'border-success bg-success/10' : 'border-border bg-background'
                  }`}
                >
                  {alt.id === activeQuestao.alternativa_Correta ? (
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-textSecondary flex-shrink-0" />
                  )}
                  <p className={`flex-grow ${alt.id === activeQuestao.alternativa_Correta ? 'text-success font-medium' : 'text-text'}`}>
                    {alt.alternativa_txt} <span className="text-textSecondary text-xs font-normal">(ID: {alt.id})</span>
                  </p>
                  {/* Exibir imagens da alternativa */}
                  {alt.imagens && alt.imagens.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {alt.imagens.map((url, imgIdx) => (
                        <img key={imgIdx} src={url} alt={`Alternativa ${alt.id} Imagem ${imgIdx}`} className="w-16 h-16 object-cover rounded-md" />
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-textSecondary italic">Nenhuma alternativa cadastrada para esta questão.</p>
            )}
          </div>
        </>
      )}
      {activeQuestao.discursiva && (
        <p className="text-textSecondary italic mt-4">
          Esta é uma questão discursiva.
        </p>
      )}
      {activeQuestao.anulada && (
        <p className="text-textSecondary italic mt-2">
          Esta questão foi anulada.
        </p>
      )}
      {activeQuestao.comentario && (
        <div className="mt-4 p-3 bg-background rounded-lg border border-border text-sm">
          <p className="font-semibold text-text">Comentário:</p>
          <div dangerouslySetInnerHTML={{ __html: activeQuestao.comentario }} />
        </div>
      )}
    </div>
  );
};

export default QuestaoDisplay;
