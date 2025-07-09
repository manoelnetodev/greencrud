import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Plus, Edit, Trash2, BookOpen, Lock, Unlock, ArrowLeft, Info, ArrowRight } from 'lucide-react';
import ProvaFormModal from '../components/ProvaFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { TIPO_DE_FOCO_OPTIONS } from '../constants';

interface Prova {
  id: number;
  created_at: string;
  instituicao: number;
  nome: string;
  ano: number;
  tipo_de_foco: string;
  uf: string;
  perguntas: string;
  bloqueada: boolean;
  qtd_questoes: number | null;
}

interface Institution {
  id: number;
  nome: string;
  nome_g: string;
}

const ProvasList: React.FC = () => {
  const { institutionId } = useParams<{ institutionId: string }>();
  const navigate = useNavigate();
  const [provas, setProvas] = useState<Prova[]>([]);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProva, setEditingProva] = useState<Prova | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [provaToDelete, setProvaToDelete] = useState<Prova | null>(null);

  const fetchProvasAndInstitution = async () => {
    setLoading(true);
    setError(null);

    if (!institutionId) {
      setError('ID da instituição não fornecido.');
      setLoading(false);
      return;
    }

    const { data: institutionData, error: institutionError } = await supabase
      .from('instituicoes')
      .select('id, nome, nome_g')
      .eq('id', parseInt(institutionId))
      .single();

    if (institutionError) {
      console.error('Erro ao buscar instituição:', institutionError);
      setError(institutionError.message);
      setLoading(false);
      return;
    }
    setInstitution(institutionData);

    const { data: provasData, error: provasError } = await supabase
      .from('provas')
      .select('*')
      .eq('instituicao', parseInt(institutionId))
      .order('ano', { ascending: false })
      .order('nome', { ascending: true });

    if (provasError) {
      console.error('Erro ao buscar provas:', provasError);
      setError(provasError.message);
      setProvas([]);
    } else {
      setProvas(provasData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProvasAndInstitution();
  }, [institutionId]);

  const handleEdit = (prova: Prova) => {
    setEditingProva(prova);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (prova: Prova) => {
    setProvaToDelete(prova);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!provaToDelete) return;

    setIsConfirmModalOpen(false);
    setLoading(true);
    const { error } = await supabase
      .from('provas')
      .delete()
      .eq('id', provaToDelete.id);

    if (error) {
      console.error('Erro ao deletar prova:', error);
      setError(error.message);
    } else {
      fetchProvasAndInstitution();
    }
    setLoading(false);
    setProvaToDelete(null);
  };

  const handleToggleBloqueada = async (prova: Prova) => {
    setLoading(true);
    const { error } = await supabase
      .from('provas')
      .update({ bloqueada: !prova.bloqueada })
      .eq('id', prova.id);

    if (error) {
      console.error('Erro ao atualizar status de bloqueio:', error);
      setError(error.message);
    } else {
      fetchProvasAndInstitution();
    }
    setLoading(false);
  };

  const handleModalClose = (refresh: boolean = false) => {
    setIsModalOpen(false);
    setEditingProva(null);
    if (refresh) {
      fetchProvasAndInstitution();
    }
  };

  const handleProvaClick = (prova: Prova) => {
    // Navegar para o editor de questões
    navigate(`/instituicoes/${institutionId}/provas/${prova.id}/questoes`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)] text-text">
        <p className="text-xl font-medium animate-pulse">Carregando provas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-error p-8 bg-error/20 rounded-xl shadow-lg max-w-md mx-auto my-12">
        <p className="text-lg mb-4">Erro ao carregar provas: {error}</p>
        <button onClick={() => navigate(-1)} className="mt-4 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md">
          Voltar
        </button>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="text-center text-textSecondary p-8 bg-surface rounded-xl shadow-lg max-w-md mx-auto my-12">
        <p className="text-lg mb-4">Instituição não encontrada.</p>
        <button onClick={() => navigate(-1)} className="mt-4 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between pb-6 border-b border-border/50 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/instituicoes')}
            className="p-3 rounded-full text-textSecondary hover:bg-surface/80 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            aria-label="Voltar para Instituições"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-4xl font-extrabold text-text leading-tight">Provas da <span className="text-primary">{institution.nome}</span></h1>
        </div>
        <button
          onClick={() => {
            setEditingProva(null);
            setIsModalOpen(true);
          }}
          className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all duration-300 ease-in-out flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Nova Prova
        </button>
      </div>

      {provas.length === 0 ? (
        <div className="text-center text-textSecondary p-12 bg-surface rounded-xl shadow-lg flex flex-col items-center justify-center">
          <Info className="w-16 h-16 text-primary mb-6 opacity-70" />
          <p className="text-xl font-medium mb-2">Nenhuma prova encontrada.</p>
          <p className="text-md">Clique em "Nova Prova" para adicionar a primeira.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {provas.map((prova) => (
            <div
              key={prova.id}
              className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between shadow-md hover:bg-surface/80 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg group"
            >
              <div className="flex items-center gap-4 flex-grow"> {/* Removed cursor-pointer and onClick */}
                <BookOpen className="w-6 h-6 text-primary flex-shrink-0" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 flex-wrap">
                  <h3 className="text-lg font-semibold text-text flex-shrink-0">{prova.nome}</h3>
                  <div className="flex items-center gap-4 text-sm text-textSecondary mt-1 sm:mt-0">
                    <p>Ano: <span className="font-medium text-text">{prova.ano}</span></p>
                    <p>Foco: <span className="font-medium text-text">{TIPO_DE_FOCO_OPTIONS.find(opt => opt === prova.tipo_de_foco) || prova.tipo_de_foco}</span></p>
                    <p>UF: <span className="font-medium text-text">{prova.uf}</span></p>
                    {prova.qtd_questoes && (
                      <p>Questões: <span className="font-medium text-text">{prova.qtd_questoes}</span></p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <p className={`text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded-full w-fit ${prova.bloqueada ? 'bg-error/20 text-error' : 'bg-success/20 text-success'}`}>
                  {prova.bloqueada ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  {prova.bloqueada ? 'Bloqueada' : 'Disponível'}
                </p>
                <button
                  onClick={() => handleToggleBloqueada(prova)}
                  className={`p-2 rounded-full ${prova.bloqueada ? 'text-success hover:bg-success/20 focus:ring-success' : 'text-error hover:bg-error/20 focus:ring-error'} transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface transform hover:scale-110`}
                  aria-label={prova.bloqueada ? 'Desbloquear prova' : 'Bloquear prova'}
                >
                  {prova.bloqueada ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => handleEdit(prova)}
                  className="p-2 rounded-full text-textSecondary hover:bg-primary/20 hover:text-primary transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface transform hover:scale-110"
                  aria-label="Editar prova"
                >
                  <Edit className="w-5 h-5" />
                </button>
                {prova.bloqueada && (
                  <button
                    onClick={() => handleDeleteClick(prova)}
                    className="p-2 rounded-full text-textSecondary hover:bg-error/20 hover:text-error transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2 focus:ring-offset-surface transform hover:scale-110"
                    aria-label="Deletar prova"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                {/* New button for accessing the editor */}
                <button
                  onClick={() => handleProvaClick(prova)}
                  className="p-2 rounded-full text-textSecondary hover:bg-secondary/20 hover:text-secondary transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-surface transform hover:scale-110"
                  aria-label="Acessar editor de questões"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <ProvaFormModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          institutionId={parseInt(institutionId!)}
          institutionName={institution.nome}
          prova={editingProva}
        />
      )}

      {isConfirmModalOpen && provaToDelete && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Confirmar Exclusão de Prova"
          message={`Você está prestes a excluir a prova "${provaToDelete.nome}" (Ano: ${provaToDelete.ano}). Esta ação é irreversível.`}
          expectedText="excluir prova"
        />
      )}
    </div>
  );
};

export default ProvasList;
