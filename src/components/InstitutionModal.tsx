import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Save, Loader2 } from 'lucide-react';

interface Instituicao {
  id?: number; // Opcional para criação
  created_at?: string;
  nome: string;
  nome_g: string;
  uf: string;
  desabilitada: boolean;
}

interface InstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // Callback para recarregar a lista após salvar
  initialData?: Instituicao | null; // Dados da instituição para edição, ou null para criação
}

// Opções de UF para o filtro (reutilizadas do InstitutionsList)
const ufOptions = [
  { label: "Selecione um Estado", value: "" }, // Opção padrão para o formulário
  { label: "Acre", value: "AC" },
  { label: "Alagoas", value: "AL" },
  { label: "Amapá", value: "AP" },
  { label: "Amazonas", value: "AM" },
  { label: "Bahia", value: "BA" },
  { label: "Ceará", value: "CE" },
  { label: "Distrito Federal", value: "DF" },
  { label: "Espírito Santo", value: "ES" },
  { label: "Goiás", value: "GO" },
  { label: "Maranhão", value: "MA" },
  { label: "Mato Grosso", value: "MT" },
  { label: "Mato Grosso do Sul", value: "MS" },
  { label: "Minas Gerais", value: "MG" },
  { label: "Pará", value: "PA" },
  { label: "Paraíba", value: "PB" },
  { label: "Paraná", value: "PR" },
  { label: "Pernambuco", value: "PE" },
  { label: "Piauí", value: "PI" },
  { label: "Rio de Janeiro", value: "RJ" },
  { label: "Rio Grande do Norte", value: "RN" },
  { label: "Rio Grande do Sul", value: "RS" },
  { label: "Rondônia", value: "RO" },
  { label: "Roraima", value: "RR" },
  { label: "Santa Catarina", value: "SC" },
  { label: "São Paulo", value: "SP" },
  { label: "Sergipe", value: "SE" },
  { label: "Tocantins", value: "TO" },
  { label: "Brasil", value: "BRASIL" }
];

const InstitutionModal: React.FC<InstitutionModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [nome, setNome] = useState('');
  const [nomeG, setNomeG] = useState('');
  const [uf, setUf] = useState('');
  const [desabilitada, setDesabilitada] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Resetar formulário ou preencher com dados iniciais
      if (initialData) {
        setNome(initialData.nome);
        setNomeG(initialData.nome_g);
        setUf(initialData.uf);
        setDesabilitada(initialData.desabilitada);
      } else {
        setNome('');
        setNomeG('');
        setUf(''); // Resetar UF para a opção padrão
        setDesabilitada(false);
      }
      setError(null); // Limpar erros ao abrir o modal
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validação básica
    if (!nome.trim() || !nomeG.trim() || !uf.trim()) {
      setError('Por favor, preencha todos os campos obrigatórios (Nome, Nome Grande, UF).');
      setLoading(false);
      return;
    }

    const institutionData: Omit<Instituicao, 'id' | 'created_at'> = {
      nome: nome.trim(),
      nome_g: nomeG.trim(),
      uf: uf.trim(),
      desabilitada: desabilitada,
    };

    let supabaseError = null;

    if (initialData && initialData.id) {
      // Modo de Edição
      const { error } = await supabase
        .from('instituicoes')
        .update(institutionData)
        .eq('id', initialData.id);
      supabaseError = error;
    } else {
      // Modo de Criação
      const { error } = await supabase
        .from('instituicoes')
        .insert([institutionData]);
      supabaseError = error;
    }

    if (supabaseError) {
      console.error('Erro ao salvar instituição:', supabaseError);
      setError(`Erro ao salvar: ${supabaseError.message}`);
    } else {
      onSave(); // Notifica o componente pai para recarregar os dados
      onClose(); // Fecha o modal
    }
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div className="bg-surface rounded-lg shadow-2xl p-6 w-full max-w-lg relative border border-border transform transition-all duration-300 scale-100 opacity-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-textSecondary hover:text-text transition-colors duration-200 p-1 rounded-full hover:bg-background"
          aria-label="Fechar modal"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 id="modal-title" className="text-2xl font-bold text-text mb-6 border-b border-border pb-3">
          {initialData ? 'Editar Instituição' : 'Criar Nova Instituição'}
        </h2>

        {error && (
          <div className="bg-error bg-opacity-20 border border-error text-error p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-textSecondary mb-1">
              Nome da Instituição <span className="text-error">*</span>
            </label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full p-3 rounded-lg bg-background border border-border text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-brand-green"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="nomeG" className="block text-sm font-medium text-textSecondary mb-1">
              Nome Grande da Instituição <span className="text-error">*</span>
            </label>
            <input
              type="text"
              id="nomeG"
              value={nomeG}
              onChange={(e) => setNomeG(e.target.value)}
              className="w-full p-3 rounded-lg bg-background border border-border text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-brand-green"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="uf" className="block text-sm font-medium text-textSecondary mb-1">
              Estado (UF) <span className="text-error">*</span>
            </label>
            <select
              id="uf"
              value={uf}
              onChange={(e) => setUf(e.target.value)}
              className="w-full p-3 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-brand-green"
              required
              aria-required="true"
            >
              {ufOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle menor e sem rótulos para Desabilitada */}
          <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
            <label htmlFor="desabilitada-toggle" className="text-sm font-medium text-textSecondary cursor-pointer">
              Status da Instituição:
            </label>
            <div
              id="desabilitada-toggle"
              className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 focus:ring-offset-background ${
                !desabilitada ? 'bg-success' : 'bg-error'
              }`}
              role="switch"
              aria-checked={!desabilitada} // true se habilitado (não desabilitado)
              tabIndex={0}
              onClick={() => setDesabilitada(!desabilitada)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setDesabilitada(!desabilitada);
                  e.preventDefault();
                }
              }}
            >
              <span className="sr-only">Status da Instituição</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  !desabilitada ? 'translate-x-8' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-background text-textSecondary rounded-lg hover:bg-border transition-colors duration-200 shadow-md"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-green text-white rounded-lg hover:bg-opacity-90 transition-colors duration-200 shadow-md flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {initialData ? 'Salvar Alterações' : 'Criar Instituição'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstitutionModal;
