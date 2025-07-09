import React, { useState, useEffect } from 'react';
import { X, Loader2, PlusCircle, Edit } from 'lucide-react'; // Adicionado Edit icon
import { supabase } from '../lib/supabase';
import { UF_OPTIONS, TIPO_DE_FOCO_OPTIONS, YEAR_OPTIONS, UF, TipoDeFoco } from '../constants';

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

interface ProvaFormModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void; // onSucess removido, onClose agora lida com refresh
  institutionId: number;
  institutionName: string;
  prova?: Prova | null; // Propriedade opcional para edição
}

const ProvaFormModal: React.FC<ProvaFormModalProps> = ({ isOpen, onClose, institutionId, institutionName, prova }) => {
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [tipoDeFoco, setTipoDeFoco] = useState<TipoDeFoco>(TIPO_DE_FOCO_OPTIONS[0]);
  const [qtdQuestoes, setQtdQuestoes] = useState<number | ''>('');
  const [uf, setUf] = useState<UF>(UF_OPTIONS[0]);
  const [bloqueada, setBloqueada] = useState<boolean>(false);
  const [nomeProva, setNomeProva] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Efeito para preencher o formulário quando uma prova é passada para edição
  useEffect(() => {
    if (prova) {
      setAno(prova.ano);
      setTipoDeFoco(prova.tipo_de_foco as TipoDeFoco);
      setQtdQuestoes(prova.qtd_questoes === null ? '' : prova.qtd_questoes);
      setUf(prova.uf as UF);
      setBloqueada(prova.bloqueada);
      setNomeProva(prova.nome); // Inicializa com o nome existente
    } else {
      // Reseta para nova prova
      setAno(new Date().getFullYear());
      setTipoDeFoco(TIPO_DE_FOCO_OPTIONS[0]);
      setQtdQuestoes('');
      setUf(UF_OPTIONS[0]);
      setBloqueada(false);
      // nomeProva será gerado pelo próximo useEffect
    }
  }, [prova]);

  // Efeito para gerar o nome da prova dinamicamente
  useEffect(() => {
    if (institutionName && ano && tipoDeFoco) {
      setNomeProva(`${institutionName} - ${ano} - (${tipoDeFoco})`);
    } else {
      setNomeProva('');
    }
  }, [institutionName, ano, tipoDeFoco]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!nomeProva || !ano || !tipoDeFoco || !uf) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    const payload = {
      nome: nomeProva,
      ano: ano,
      tipo_de_foco: tipoDeFoco,
      instituicao: institutionId,
      qtd_questoes: qtdQuestoes === '' ? null : qtdQuestoes,
      uf: uf,
      bloqueada: bloqueada,
    };

    let supabaseCall;
    if (prova) {
      // Atualizar prova existente
      supabaseCall = supabase
        .from('provas')
        .update(payload)
        .eq('id', prova.id);
    } else {
      // Criar nova prova
      supabaseCall = supabase
        .from('provas')
        .insert(payload);
    }

    const { error: supabaseError } = await supabaseCall;

    if (supabaseError) {
      console.error('Erro ao salvar prova:', supabaseError);
      setError(`Erro ao salvar prova: ${supabaseError.message}`);
    } else {
      onClose(true); // Fecha o modal e sinaliza para atualizar a lista
      // Reseta os campos apenas se estiver criando uma nova prova
      if (!prova) {
        setAno(new Date().getFullYear());
        setTipoDeFoco(TIPO_DE_FOCO_OPTIONS[0]);
        setQtdQuestoes('');
        setUf(UF_OPTIONS[0]);
        setBloqueada(false);
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-surface p-6 rounded-lg shadow-2xl w-full max-w-md border border-border relative animate-fade-in-up">
        <button
          onClick={() => onClose()} // Fecha sem refresh se não houver sucesso
          className="absolute top-4 right-4 text-textSecondary hover:text-text transition-colors duration-200"
          aria-label="Fechar modal"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-text mb-6 border-b border-border pb-3">
          {prova ? 'Editar Prova' : 'Criar Nova Prova'}
        </h2>

        {error && (
          <div className="bg-error bg-opacity-20 border border-error text-error p-3 rounded-lg mb-4">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="nomeProva" className="block text-sm font-medium text-textSecondary mb-1">
              Nome da Prova (Gerado Automaticamente)
            </label>
            <input
              id="nomeProva"
              type="text"
              value={nomeProva}
              readOnly
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="ano" className="block text-sm font-medium text-textSecondary mb-1">
              Ano
            </label>
            <select
              id="ano"
              value={ano}
              onChange={(e) => setAno(parseInt(e.target.value))}
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-8"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tipoDeFoco" className="block text-sm font-medium text-textSecondary mb-1">
              Tipo de Foco
            </label>
            <select
              id="tipoDeFoco"
              value={tipoDeFoco}
              onChange={(e) => setTipoDeFoco(e.target.value as TipoDeFoco)}
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-8"
            >
              {TIPO_DE_FOCO_OPTIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="uf" className="block text-sm font-medium text-textSecondary mb-1">
              UF
            </label>
            <select
              id="uf"
              value={uf}
              onChange={(e) => setUf(e.target.value as UF)}
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-8"
            >
              {UF_OPTIONS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="qtdQuestoes" className="block text-sm font-medium text-textSecondary mb-1">
              Quantidade de Questões (Opcional)
            </label>
            <input
              id="qtdQuestoes"
              type="number"
              value={qtdQuestoes}
              onChange={(e) => setQtdQuestoes(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-full p-3 bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: 80"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-textSecondary">Bloqueada</span>
            <label htmlFor="bloqueada" className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="bloqueada"
                className="sr-only peer"
                checked={bloqueada}
                onChange={(e) => setBloqueada(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 shadow-md font-semibold text-lg"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              prova ? <Edit className="w-5 h-5 mr-2" /> : <PlusCircle className="w-5 h-5 mr-2" />
            )}
            {loading ? (prova ? 'Salvando...' : 'Criando...') : (prova ? 'Salvar Alterações' : 'Criar Prova')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProvaFormModal;
