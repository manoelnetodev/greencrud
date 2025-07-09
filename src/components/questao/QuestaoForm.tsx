import React from 'react';
import { ArrowLeft, Plus, Edit, Trash2, CheckCircle, XCircle, Circle, Type, MinusCircle, Copy } from 'lucide-react';
import ConfirmationModal from '../ConfirmationModal';
import { QuestaoFormData, AlternativaForm, Categoria, Subcategoria, Assunto, QuestaoFormProps } from '../../types'; // Import QuestaoFormData
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill's CSS

// QuestaoFormProps interface has been moved to src/types/index.ts

const QuestaoForm: React.FC<QuestaoFormProps> = ({
  editingFormData,
  setEditingFormData,
  onSave,
  onCancel,
  loading,
  errors,
  copyFeedback,
  handleCopyId,
  allCategories,
  filteredSubcategories,
  filteredAssuntos,
  loadingCategories,
  loadingSubcategories,
  loadingAssuntos,
  categoryError,
  subcategoryError,
  assuntoError,
  handleSelectChange,
  handleChange,
  handleCheckboxChange,
  handleAlternativeChange,
  handleCorrectAlternativeChange,
  handleAddAlternative,
  handleRemoveAlternativeUrl,
  handleRemoveNewAlternativeFile,
  handleRemoveAlternative,
  isConfirmDeleteAlternativeModalOpen,
  alternativeToDeleteInfo,
  setIsConfirmDeleteAlternativeModalOpen,
  handleConfirmDeleteAlternative,
  handleEnunciadoImageChange,
  handleRemoveEnunciadoUrl,
  handleRemoveNewEnunciadoFile,
  handleAlternativeImageChange,
}) => {

  React.useEffect(() => {
    if (editingFormData.categoria && !filteredSubcategories.some(s => s.id === editingFormData.subcategoria)) {
      setEditingFormData(prev => prev ? { ...prev, subcategoria: null, assunto: null } : null);
    }
  }, [editingFormData.categoria, editingFormData.subcategoria, filteredSubcategories, setEditingFormData]);

  React.useEffect(() => {
    if (editingFormData.subcategoria && !filteredAssuntos.some(a => a.id === editingFormData.assunto)) {
      setEditingFormData(prev => prev ? { ...prev, assunto: null } : null);
    }
  }, [editingFormData.subcategoria, editingFormData.assunto, filteredAssuntos, setEditingFormData]);

  // Handler for ReactQuill
  const handleCommentChange = (content: string) => {
    setEditingFormData(prev => prev ? { ...prev, comentario: content === '<p><br></p>' ? null : content } : null);
  };

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']                                         // remove formatting button
    ],
  };

  const formats = [
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link'
  ];

  return (
    <form onSubmit={onSave} className="bg-surface border border-border rounded-xl p-6 shadow-md animate-scale-in-up">
      <div className="flex items-center justify-between pb-6 border-b border-border/50 mb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="p-3 rounded-full text-textSecondary hover:bg-surface/80 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            aria-label="Voltar e cancelar edição"
            disabled={loading}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-text leading-tight">
            {editingFormData.id
              ? (
                <>
                  Você está editando a questão {editingFormData.numero !== null ? editingFormData.numero : editingFormData.id}
                  <span
                    className="text-textSecondary text-sm font-normal ml-2 cursor-pointer hover:underline relative"
                    onClick={() => handleCopyId(editingFormData.id)}
                    title="Clique para copiar o ID"
                  >
                    (ID: {editingFormData.id})
                    {copyFeedback && (
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-2 py-1 rounded-md whitespace-nowrap animate-fade-in">
                        {copyFeedback}
                      </span>
                    )}
                  </span>
                </>
              )
              : 'Nova Questão'}
          </h2>
        </div>
        <button
          type="submit"
          className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Salvando...
            </>
          ) : (
            editingFormData.id ? 'Salvar Alterações' : 'Criar Questão'
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Campos de Categoria, Subcategoria, Assunto */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="categoria" className="block text-sm font-medium text-textSecondary mb-2">
              Categoria
            </label>
            <select
              id="categoria"
              name="categoria"
              value={editingFormData.categoria || ''}
              onChange={handleSelectChange}
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-8"
              disabled={loading || loadingCategories}
            >
              <option value="">Selecione uma Categoria</option>
              {allCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
            {loadingCategories && <p className="text-textSecondary text-xs mt-1">Carregando categorias...</p>}
            {categoryError && <p className="text-error text-xs mt-1">{categoryError}</p>}
          </div>

          <div>
            <label htmlFor="subcategoria" className="block text-sm font-medium text-textSecondary mb-2">
              Subcategoria
            </label>
            <select
              id="subcategoria"
              name="subcategoria"
              value={editingFormData.subcategoria || ''}
              onChange={handleSelectChange}
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-8"
              disabled={loading || loadingSubcategories || !editingFormData.categoria}
            >
              <option value="">Selecione uma Subcategoria</option>
              {filteredSubcategories.map(subcat => (
                <option key={subcat.id} value={subcat.id}>{subcat.nome}</option>
              ))}
            </select>
            {loadingSubcategories && <p className="text-textSecondary text-xs mt-1">Carregando subcategorias...</p>}
            {subcategoryError && <p className="text-error text-xs mt-1">{subcategoryError}</p>}
          </div>

          <div>
            <label htmlFor="assunto" className="block text-sm font-medium text-textSecondary mb-2">
              Assunto
            </label>
            <select
              id="assunto"
              name="assunto"
              value={editingFormData.assunto || ''}
              onChange={handleSelectChange}
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-8"
              disabled={loading || loadingAssuntos || !editingFormData.subcategoria}
            >
              <option value="">Selecione um Assunto</option>
              {filteredAssuntos.map(ass => (
                <option key={ass.id} value={ass.id}>{ass.nome}</option>
              ))}
            </select>
            {loadingAssuntos && <p className="text-textSecondary text-xs mt-1">Carregando assuntos...</p>}
            {assuntoError && <p className="text-error text-xs mt-1">{assuntoError}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="enunciado" className="block text-sm font-medium text-textSecondary mb-2">
            Enunciado da Questão <span className="text-error">*</span>
          </label>
          <textarea
            id="enunciado"
            name="enunciado"
            value={editingFormData.enunciado}
            onChange={handleChange}
            rows={5}
            className="w-full p-3 bg-background border border-border rounded-lg text-text placeholder-textSecondary focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ease-in-out resize-y"
            placeholder="Digite o enunciado completo da questão..."
            required
            disabled={loading}
          />
          {errors.enunciado && <p className="text-error text-sm mt-1">{errors.enunciado}</p>}
        </div>

        {/* Seção de Imagens do Enunciado */}
        <div className="space-y-3 border border-border/70 rounded-lg p-4 bg-background">
          <h3 className="text-lg font-semibold text-text">Imagens do Enunciado</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {(editingFormData.imagens_enunciado || []).map((url, idx) => (
              <div key={url} className="relative w-24 h-24 border border-border rounded-lg overflow-hidden">
                <img src={url} alt={`Enunciado ${idx}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveEnunciadoUrl(url)}
                  className="absolute top-1 right-1 bg-error text-white rounded-full p-1 text-xs hover:bg-error/80"
                  title="Remover imagem"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(editingFormData.newEnunciadoFiles || []).map((file, idx) => (
              <div key={file.name + idx} className="relative w-24 h-24 border border-border rounded-lg overflow-hidden opacity-70">
                <img src={URL.createObjectURL(file)} alt={`Nova imagem ${idx}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveNewEnunciadoFile(file)}
                  className="absolute top-1 right-1 bg-error text-white rounded-full p-1 text-xs hover:bg-error/80"
                  title="Remover nova imagem"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <input
            type="file"
            multiple
            onChange={handleEnunciadoImageChange}
            className="block w-full text-sm text-textSecondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="comentario" className="block text-sm font-medium text-textSecondary mb-2">
            Comentário da Questão (Opcional)
          </label>
          <ReactQuill
            theme="snow"
            value={editingFormData.comentario || ''}
            onChange={handleCommentChange}
            modules={modules}
            formats={formats}
            placeholder="Adicione um comentário ou explicação sobre a questão..."
            readOnly={loading}
            className="bg-background rounded-lg text-text quill-custom-theme" // Add a custom class for styling
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
              value={editingFormData.numero === null ? '' : editingFormData.numero}
              onChange={handleChange}
              className="w-full p-3 bg-background border border-border rounded-lg text-text placeholder-textSecondary focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ease-in-out"
              placeholder="Ex: 1, 2, 3..."
              disabled={loading}
            />
          </div>
          <div className="flex flex-col justify-center gap-4 mt-4 sm:mt-0">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="discursiva"
                name="discursiva"
                checked={editingFormData.discursiva}
                onChange={handleCheckboxChange}
                className="h-5 w-5 text-primary rounded border-border bg-background focus:ring-primary cursor-pointer"
                disabled={loading}
              />
              <label htmlFor="discursiva" className="ml-2 text-sm font-medium text-text">
                Questão Discursiva
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="anulada"
                name="anulada"
                checked={editingFormData.anulada}
                onChange={handleCheckboxChange}
                className="h-5 w-5 text-accent rounded border-border bg-background focus:ring-accent cursor-pointer"
                disabled={loading}
              />
              <label htmlFor="anulada" className="ml-2 text-sm font-medium text-text">
                Questão Anulada
              </label>
            </div>
          </div>
        </div>


        {!editingFormData.discursiva && (
          <div className="space-y-4 border border-border/70 rounded-lg p-4 bg-background">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-text">Alternativas {(!editingFormData.anulada && <span className="text-error">*</span>)}</h3>
              <button
                type="button"
                onClick={handleAddAlternative}
                className="bg-primary text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center gap-1"
                disabled={loading}
              >
                <Plus className="w-4 h-4" /> Adicionar Alternativa
              </button>
            </div>
            {errors.alternativas && <p className="text-error text-sm mt-1">{errors.alternativas}</p>}
            {errors.correta && <p className="text-error text-sm mt-1">{errors.correta}</p>}

            {editingFormData.alternativas.length === 0 && (
              <p className="text-textSecondary italic text-sm">Adicione pelo menos duas alternativas para questões objetivas.</p>
            )}

            <div className="space-y-3">
              {editingFormData.alternativas.map((alt, index) => (
                <div key={alt.id || `new-${index}`} className="flex items-start gap-3 p-3 bg-surface rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => handleCorrectAlternativeChange(index)}
                    className="flex-shrink-0 p-1 rounded-full text-textSecondary hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface"
                    aria-label={alt.correta ? 'Alternativa correta' : 'Marcar como correta'}
                    disabled={loading || editingFormData.anulada}
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
                      disabled={loading}
                    />
                    {alt.id && alt.id > 0 && (
                      <span className="text-textSecondary text-xs ml-2">(ID: {alt.id})</span>
                    )}
                    <input
                      type="text"
                      value={alt.comentario || ''}
                      onChange={(e) => handleAlternativeChange(index, 'comentario', e.target.value)}
                      className="w-full mt-2 p-2 bg-background border border-border rounded-lg text-text placeholder-textSecondary focus:ring-1 focus:ring-primary focus:border-transparent text-sm"
                      placeholder={`Comentário da alternativa ${index + 1} (opcional)`}
                      disabled={loading}
                    />

                    {/* Seção de Imagens da Alternativa */}
                    <div className="mt-3 space-y-2">
                      <h4 className="text-sm font-semibold text-textSecondary">Imagens da Alternativa</h4>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(alt.imagens || []).map((url, imgIdx) => (
                          <div key={url} className="relative w-20 h-20 border border-border rounded-lg overflow-hidden">
                            <img src={url} alt={`Alternativa ${index} Imagem ${imgIdx}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveAlternativeUrl(index, url)}
                              className="absolute top-0.5 right-0.5 bg-error text-white rounded-full p-0.5 text-xs hover:bg-error/80"
                              title="Remover imagem"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {(alt.newFiles || []).map((file, imgIdx) => (
                          <div key={file.name + idx} className="relative w-20 h-20 border border-border rounded-lg overflow-hidden opacity-70">
                            <img src={URL.createObjectURL(file)} alt={`Nova imagem ${imgIdx}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveNewAlternativeFile(index, file)}
                              className="absolute top-0.5 right-0.5 bg-error text-white rounded-full p-0.5 text-xs hover:bg-error/80"
                              title="Remover nova imagem"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => handleAlternativeImageChange(index, e)}
                        className="block w-full text-xs text-textSecondary file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAlternative(index)}
                    className="flex-shrink-0 p-2 rounded-full text-textSecondary hover:bg-error/20 hover:text-error transition-colors focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2 focus:ring-offset-surface"
                    aria-label="Remover alternativa"
                    disabled={loading}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação para Excluir Alternativa */}
      {isConfirmDeleteAlternativeModalOpen && alternativeToDeleteInfo && (
        <ConfirmationModal
          isOpen={isConfirmDeleteAlternativeModalOpen}
          onClose={() => {
            setIsConfirmDeleteAlternativeModalOpen(false);
          }}
          onConfirm={handleConfirmDeleteAlternative}
          title="Confirmar Remoção de Alternativa"
          message={`Você está prestes a remover "${alternativeToDeleteInfo.text}" (ID: ${alternativeToDeleteInfo.id}). Esta alternativa será permanentemente excluída do banco de dados quando você salvar a questão. Esta ação é irreversível após o salvamento.`}
          expectedText="remover alternativa"
        />
      )}
    </form>
  );
};

export default QuestaoForm;
