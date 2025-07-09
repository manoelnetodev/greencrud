import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Plus, Edit, Trash2, ChevronDown, MapPin, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InstitutionModal from '../components/InstitutionModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { UF_OPTIONS } from '../constants';

interface Institution {
  id: number;
  created_at: string;
  nome: string;
  nome_g: string;
  uf: string;
  desabilitada: boolean;
  provas_count: number;
}

const InstitutionsList: React.FC = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); // NOVO: Estado para o termo de busca debounced
  const [selectedUf, setSelectedUf] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [institutionToDelete, setInstitutionToDelete] = useState<Institution | null>(null);
  const navigate = useNavigate();

  // Estados de Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalInstitutionsCount, setTotalInstitutionsCount] = useState(0);
  const itemsPerPage = 10; // Constante para itens por página

  // NOVO: useEffect para implementar o debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Atraso de 500ms

    // Função de limpeza: cancela o timer se o searchTerm mudar antes do atraso
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]); // Depende do searchTerm para disparar o timer

  // Use useCallback para memoizar a função de busca e evitar re-renderizações desnecessárias
  const fetchInstitutions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    let query = supabase
      .from('instituicoes_with_provas_count')
      .select('*', { count: 'exact' }); // Solicita a contagem exata de resultados

    // Aplica filtros usando o debouncedSearchTerm
    if (debouncedSearchTerm) { // ALTERADO: Usando debouncedSearchTerm
      query = query.or(`nome.ilike.%${debouncedSearchTerm}%,nome_g.ilike.%${debouncedSearchTerm}%`);
    }
    if (selectedUf) {
      query = query.eq('uf', selectedUf);
    }

    // Aplica ordenação e range para paginação
    query = query.order('nome', { ascending: true }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching institutions:', error);
      setError(error.message);
      setInstitutions([]);
      setTotalInstitutionsCount(0);
    } else {
      setInstitutions(data || []);
      setTotalInstitutionsCount(count || 0); // Define a contagem total
    }
    setLoading(false);
  }, [currentPage, debouncedSearchTerm, selectedUf, itemsPerPage]); // ALTERADO: debouncedSearchTerm é a dependência

  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]); // fetchInstitutions é agora uma dependência

  // Calcula o total de páginas
  const totalPages = useMemo(() => {
    return Math.ceil(totalInstitutionsCount / itemsPerPage);
  }, [totalInstitutionsCount, itemsPerPage]);

  // Lida com a mudança de página
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleEdit = (institution: Institution) => {
    setEditingInstitution(institution);
    setIsModalOpen(true);
  };

  const handleDelete = (institution: Institution) => {
    setInstitutionToDelete(institution);
    setIsDeleteConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!institutionToDelete) return;

    setLoading(true);
    const { error } = await supabase
      .from('instituicoes')
      .update({ desabilitada: true })
      .eq('id', institutionToDelete.id);

    if (error) {
      console.error('Error disabling institution:', error);
      setError(error.message);
    } else {
      // Após a operação, recarrega os dados da página atual
      fetchInstitutions();
    }
    setLoading(false);
    setIsDeleteConfirmModalOpen(false);
    setInstitutionToDelete(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingInstitution(null);
    // Recarrega as instituições após fechar o modal (para adicionar/editar)
    fetchInstitutions();
  };

  const handleDeleteConfirmModalClose = () => {
    setIsDeleteConfirmModalOpen(false);
    setInstitutionToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)] text-text">
        <p className="text-xl">Carregando instituições...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-error p-4 bg-error/20 rounded-lg">
        <p>Erro ao carregar instituições: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-0">
      <h1 className="text-3xl font-bold text-text mb-2">Instituições</h1>
      <p className="text-textSecondary mb-6">Confira nosso acervo com mais de 1000 provas de residência médica</p>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textSecondary" />
          <input
            type="text"
            placeholder="Buscar por instituição"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reseta para a primeira página na busca
            }}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          />
        </div>
        <div className="relative w-full sm:w-auto flex-shrink-0">
          <select
            value={selectedUf}
            onChange={(e) => {
              setSelectedUf(e.target.value);
              setCurrentPage(1); // Reseta para a primeira página na mudança de UF
            }}
            className="appearance-none w-full pr-8 pl-4 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          >
            <option value="">Todas as UFs</option>
            {UF_OPTIONS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary pointer-events-none" />
        </div>
        <button
          onClick={() => {
            setEditingInstitution(null);
            setIsModalOpen(true);
          }}
          className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
          Nova Instituição
        </button>
      </div>

      {institutions.length === 0 && !loading ? (
        <div className="text-center text-textSecondary p-8 bg-surface rounded-lg">
          <p>Nenhuma instituição encontrada com os critérios de busca.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {institutions.map((institution) => (
            <div
              key={institution.id}
              className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between hover:bg-surface/80 transition-colors"
            >
              <div className="flex-grow cursor-pointer" onClick={() => navigate(`/instituicoes/${institution.id}/provas`)}>
                {/* Nome principal (nome) */}
                <h3 className="text-lg font-semibold text-text flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  {institution.nome} - {institution.uf}
                </h3>
                {/* Nome geral (nome_g) - menor */}
                <p className="text-textSecondary text-sm ml-7">{institution.nome_g}</p>
                <p className="text-textSecondary text-xs ml-7 mt-1 flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-secondary" />
                  Qtd. Provas: <span className="font-medium text-text">{institution.provas_count}</span>
                </p>
                <p className={`text-xs ml-7 mt-1 font-medium ${institution.desabilitada ? 'text-error' : 'text-success'}`}>
                  Status: {institution.desabilitada ? 'Desabilitado' : 'Habilitado'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(institution);
                  }}
                  className="p-2 rounded-full text-textSecondary hover:bg-primary/20 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Editar instituição"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(institution);
                  }}
                  className="p-2 rounded-full text-textSecondary hover:bg-error/20 hover:text-error transition-colors focus:outline-none focus:ring-2 focus:ring-error"
                  aria-label="Desabilitar instituição"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="p-1.5 rounded-lg bg-surface border border-border text-textSecondary hover:bg-surface/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              disabled={currentPage === page || loading}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors
                ${currentPage === page
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border text-textSecondary hover:bg-surface/60'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="p-1.5 rounded-lg bg-surface border border-border text-textSecondary hover:bg-surface/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {isModalOpen && (
        <InstitutionModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={fetchInstitutions}
          initialData={editingInstitution}
        />
      )}

      {isDeleteConfirmModalOpen && institutionToDelete && (
        <ConfirmationModal
          isOpen={isDeleteConfirmModalOpen}
          onClose={handleDeleteConfirmModalClose}
          onConfirm={handleConfirmDelete}
          title="Confirmar Desabilitação"
          message={`Você está prestes a desabilitar a instituição "${institutionToDelete.nome_g}". Esta ação não pode ser desfeita facilmente.`}
          expectedText="confirmar exclusao"
        />
      )}
    </div>
  );
};

export default InstitutionsList;
