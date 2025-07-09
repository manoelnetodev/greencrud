import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import QuestaoForm from '../components/questao/QuestaoForm';
import QuestaoDisplay from '../components/questao/QuestaoDisplay';
import QuestaoNavigationPanel from '../components/questao/QuestaoNavigationPanel';
import { useQuestaoManagement } from '../hooks/useQuestaoManagement';
import { useTaxonomyData } from '../hooks/useTaxonomyData';

const QuestaoEditor: React.FC = () => {
  const { institutionId, provaId } = useParams<{ institutionId: string; provaId: string }>();
  const navigate = useNavigate();

  // Use custom hooks for data and state management
  const {
    prova,
    questoes,
    loading,
    error,
    isEditingActiveQuestao,
    editingFormData,
    setEditingFormData,
    errors,
    isConfirmDeleteQuestaoModalOpen,
    questaoToDelete,
    setIsConfirmDeleteQuestaoModalOpen,
    setQuestaoToDelete,
    isConfirmDeleteAlternativeModalOpen,
    alternativeToDeleteInfo,
    setIsConfirmDeleteAlternativeModalOpen,
    setAlternativeToDeleteInfo,
    activeQuestaoId,
    setActiveQuestaoId,
    copyFeedback,
    fetchProvaAndQuestoes,
    handleCopyId,
    handleAddQuestao,
    handleEditQuestao,
    handleCancelEdit,
    handleSaveQuestao,
    handleDeleteQuestaoClick,
    handleConfirmDeleteQuestao,
    handleChange,
    handleCheckboxChange,
    handleSelectChange,
    handleAlternativeChange,
    handleCorrectAlternativeChange,
    handleAddAlternative,
    handleRemoveAlternativeUrl,
    handleRemoveNewAlternativeFile,
    handleRemoveAlternative,
    handleConfirmDeleteAlternative,
    handleEnunciadoImageChange,
    handleRemoveEnunciadoUrl,
    handleRemoveNewEnunciadoFile,
    handleAlternativeImageChange,
  } = useQuestaoManagement(institutionId!, provaId!);

  const {
    allCategories,
    filteredSubcategories,
    filteredAssuntos,
    loadingCategories,
    loadingSubcategories,
    loadingAssuntos,
    loadingAllSubcategories,
    loadingAllAssuntos,
    categoryError,
    subcategoryError,
    assuntoError,
    fetchFilteredSubcategories,
    fetchFilteredAssuntos,
    categoryMap,
    subcategoryMap,
    assuntoMap,
  } = useTaxonomyData();

  // Effect to fetch filtered subcategories when category changes in form
  useEffect(() => {
    if (editingFormData?.categoria) {
      fetchFilteredSubcategories(editingFormData.categoria);
    } else {
      // If category is cleared, clear subcategory and assunto in form data
      setEditingFormData(prev => prev ? { ...prev, subcategoria: null, assunto: null } : null);
    }
  }, [editingFormData?.categoria, fetchFilteredSubcategories, setEditingFormData]);

  // Effect to fetch filtered assuntos when subcategory changes in form
  useEffect(() => {
    if (editingFormData?.subcategoria) {
      fetchFilteredAssuntos(editingFormData.subcategoria);
    } else {
      // If subcategory is cleared, clear assunto in form data
      setEditingFormData(prev => prev ? { ...prev, assunto: null } : null);
    }
  }, [editingFormData?.subcategoria, fetchFilteredAssuntos, setEditingFormData]);

  const scrollToQuestao = (id: number) => {
    if (isEditingActiveQuestao) {
      alert('Por favor, salve ou cancele as alterações antes de navegar para outra questão.');
      return;
    }
    setActiveQuestaoId(id);
    const element = document.getElementById(`questao-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading || loadingCategories || loadingAllSubcategories || loadingAllAssuntos) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-text">
        <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-2xl font-medium">Carregando dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-error p-8 bg-error/20 rounded-xl shadow-lg max-w-md mx-auto my-12">
        <p className="text-lg mb-4">Erro ao carregar questões: {error}</p>
        <button onClick={() => navigate(-1)} className="mt-4 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md">
          Voltar
        </button>
      </div>
    );
  }

  if (!prova) {
    return (
      <div className="text-center text-textSecondary p-8 bg-surface rounded-xl shadow-lg max-w-md mx-auto my-12">
        <p className="text-lg mb-4">Prova não encontrada.</p>
        <button onClick={() => navigate(-1)} className="mt-4 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md">
          Voltar
        </button>
      </div>
    );
  }

  const activeQuestao = questoes.find(q => q.id === activeQuestaoId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
      {/* Conteúdo Principal (Questões) */}
      <div className="flex-grow">
        {/* Cabeçalho principal da página (visível apenas quando não está editando) */}
        <div className={`flex items-center justify-between pb-6 border-b border-border/50 mb-8 ${isEditingActiveQuestao ? 'hidden' : ''}`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/instituicoes/${institutionId}/provas`)}
              className="p-3 rounded-full text-textSecondary hover:bg-surface/80 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
              aria-label="Voltar para Provas"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-base font-extrabold text-text leading-tight">
              Questões da Prova <span className="text-primary">{prova.nome} ({prova.ano})</span>
            </h1>
          </div>
          <button
            onClick={handleAddQuestao}
            className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all duration-300 ease-in-out flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            disabled={isEditingActiveQuestao}
          >
            <Plus className="w-5 h-5" />
            Nova Questão
          </button>
        </div>

        {questoes.length === 0 && !isEditingActiveQuestao ? (
          <div className="text-center text-textSecondary p-12 bg-surface rounded-xl shadow-lg flex flex-col items-center justify-center">
            <Plus className="w-16 h-16 text-primary mb-6 opacity-70" />
            <p className="text-xl font-medium mb-2">Nenhuma questão encontrada para esta prova.</p>
            <p className="text-md">Clique em "Nova Questão" para adicionar a primeira.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {isEditingActiveQuestao && editingFormData ? (
              <QuestaoForm
                editingFormData={editingFormData}
                setEditingFormData={setEditingFormData}
                onSave={handleSaveQuestao}
                onCancel={handleCancelEdit}
                loading={loading}
                errors={errors}
                copyFeedback={copyFeedback}
                handleCopyId={handleCopyId}
                allCategories={allCategories}
                filteredSubcategories={filteredSubcategories}
                filteredAssuntos={filteredAssuntos}
                loadingCategories={loadingCategories}
                loadingSubcategories={loadingSubcategories}
                loadingAssuntos={loadingAssuntos}
                categoryError={categoryError}
                subcategoryError={subcategoryError}
                assuntoError={assuntoError}
                handleSelectChange={handleSelectChange}
                handleChange={handleChange}
                handleCheckboxChange={handleCheckboxChange}
                handleAlternativeChange={handleAlternativeChange}
                handleCorrectAlternativeChange={handleCorrectAlternativeChange}
                handleAddAlternative={handleAddAlternative}
                handleRemoveAlternativeUrl={handleRemoveAlternativeUrl}
                handleRemoveNewAlternativeFile={handleRemoveNewAlternativeFile}
                handleRemoveAlternative={handleRemoveAlternative}
                isConfirmDeleteAlternativeModalOpen={isConfirmDeleteAlternativeModalOpen}
                alternativeToDeleteInfo={alternativeToDeleteInfo}
                setIsConfirmDeleteAlternativeModalOpen={setIsConfirmDeleteAlternativeModalOpen}
                handleConfirmDeleteAlternative={handleConfirmDeleteAlternative}
                handleEnunciadoImageChange={handleEnunciadoImageChange}
                handleRemoveEnunciadoUrl={handleRemoveEnunciadoUrl}
                handleRemoveNewEnunciadoFile={handleRemoveNewEnunciadoFile}
                handleAlternativeImageChange={handleAlternativeImageChange}
              />
            ) : (
              <QuestaoDisplay
                activeQuestao={activeQuestao}
                categoryMap={categoryMap}
                subcategoryMap={subcategoryMap}
                assuntoMap={assuntoMap}
                onEdit={handleEditQuestao}
                onDelete={handleDeleteQuestaoClick}
                handleCopyId={handleCopyId}
                copyFeedback={copyFeedback}
              />
            )}
          </div>
        )}
      </div>

      {/* Painel de Navegação Rápida */}
      <QuestaoNavigationPanel
        questoes={questoes}
        activeQuestaoId={activeQuestaoId}
        isEditingActiveQuestao={isEditingActiveQuestao}
        editingFormData={editingFormData}
        scrollToQuestao={scrollToQuestao}
      />

      {/* Modal de Confirmação para Excluir Questão */}
      {isConfirmDeleteQuestaoModalOpen && questaoToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteQuestaoModalOpen}
          onClose={() => setIsConfirmDeleteQuestaoModalOpen(false)}
          onConfirm={handleConfirmDeleteQuestao}
          title="Confirmar Exclusão de Questão"
          message={`Você está prestes a excluir a questão ${questaoToDelete.numero ? `número ${questaoToDelete.numero}` : ''} "${questaoToDelete.enunciado?.substring(0, 50)}..." (ID: ${questaoToDelete.id}). Esta ação também excluirá todas as alternativas associadas e é irreversível.`}
          expectedText="excluir questão"
        />
      )}
    </div>
  );
};

export default QuestaoEditor;
