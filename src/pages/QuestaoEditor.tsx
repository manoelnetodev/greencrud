import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Edit, Trash2, CheckCircle, XCircle, Info, Circle, Type, MinusCircle, Copy } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';

// Interfaces (mantidas como estão)
interface Alternativa {
  id: number;
  created_at: string;
  alternativa_txt: string | null;
  comentario: string | null;
  correta: boolean | null;
  imagens: string[] | null;
  questao: number;
  comentario_validado: boolean | null;
}

interface Questao {
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
  // REMOVIDO: Propriedades para os nomes das tabelas relacionadas
  // categorias?: { nome: string } | null;
  // subcategorias?: { nome: string } | null;
  // assuntos?: { nome: string } | null;
}

interface Prova {
  id: number;
  nome: string;
  ano: number;
}

// NOVO: Interfaces para Categoria, Subcategoria, Assunto
interface Categoria {
  id: number;
  nome: string;
  abrev: string | null;
  cor_background: string | null;
}

interface Subcategoria {
  id: number;
  nome: string;
  categoria: number;
}

interface Assunto {
  id: number;
  nome: string;
  categoria: number;
  subcategoria: number;
  tempo_de_aula: number | null;
}

interface AlternativaForm {
  id: number | null;
  alternativa_txt: string;
  correta: boolean;
  comentario: string | null;
  imagens: string[] | null;
  newFiles?: File[];
  removedUrls?: string[];
}

interface QuestaoForm {
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

const QuestaoEditor: React.FC = () => {
  const { institutionId, provaId } = useParams<{ institutionId: string; provaId: string }>();
  const navigate = useNavigate();
  const [prova, setProva] = useState<Prova | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditingActiveQuestao, setIsEditingActiveQuestao] = useState(false);
  const [editingFormData, setEditingFormData] = useState<QuestaoForm | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [nextAltId, setNextAltId] = useState(-1);

  const [isConfirmDeleteQuestaoModalOpen, setIsConfirmDeleteQuestaoModalOpen] = useState(false);
  const [questaoToDelete, setQuestaoToDelete] = useState<Questao | null>(null);

  const [isConfirmDeleteAlternativeModalOpen, setIsConfirmDeleteAlternativeModalOpen] = useState(false);
  const [alternativeToDeleteInfo, setAlternativeToDeleteInfo] = useState<{ index: number; id: number | null; text: string } | null>(null);

  const [activeQuestaoId, setActiveQuestaoId] = useState<number | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const [allCategories, setAllCategories] = useState<Categoria[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategoria[]>([]); // Para dropdown de edição
  const [filteredAssuntos, setFilteredAssuntos] = useState<Assunto[]>([]); // Para dropdown de edição

  // NOVO: Estados para todas as subcategorias e assuntos (para lookup de nomes)
  const [allSubcategories, setAllSubcategories] = useState<Subcategoria[]>([]);
  const [allAssuntos, setAllAssuntos] = useState<Assunto[]>([]);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false); // Para dropdown
  const [loadingAssuntos, setLoadingAssuntos] = useState(false); // Para dropdown
  const [loadingAllSubcategories, setLoadingAllSubcategories] = useState(false); // Para lookup
  const [loadingAllAssuntos, setLoadingAllAssuntos] = useState(false); // Para lookup

  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [subcategoryError, setSubcategoryError] = useState<string | null>(null);
  const [assuntoError, setAssuntoError] = useState<string | null>(null);

  const BUCKET_NAME = 'question-images'; // Substitua pelo nome do seu bucket no Supabase Storage

  // Função auxiliar para mapear Questao para QuestaoForm
  const mapQuestaoToQuestaoForm = (questao: Questao): QuestaoForm => ({
    id: questao.id,
    enunciado: questao.enunciado || '',
    comentario: questao.comentario || null,
    numero: questao.numero,
    discursiva: questao.discursiva || false,
    anulada: questao.anulada || false,
    assunto: questao.assunto,
    categoria: questao.categoria,
    subcategoria: questao.subcategoria,
    ano: questao.ano || null,
    dif_q: questao.dif_q || null,
    foco: questao.foco || null,
    imagens_enunciado: questao.imagens_enunciado || null,
    newEnunciadoFiles: [],
    removedEnunciadoUrls: [],
    alternativas: questao.alternativas?.map(alt => ({
      id: alt.id,
      alternativa_txt: alt.alternativa_txt || '',
      comentario: alt.comentario || null,
      correta: alt.id === questao.alternativa_Correta,
      imagens: alt.imagens || null,
      newFiles: [],
      removedUrls: [],
    })) || [],
  });

  const fetchProvaAndQuestoes = async () => {
    setLoading(true);
    setError(null);

    if (!provaId) {
      setError('ID da prova não fornecido.');
      setLoading(false);
      return;
    }

    try {
      const { data: provaData, error: provaError } = await supabase
        .from('provas')
        .select('id, nome, ano')
        .eq('id', parseInt(provaId))
        .single();

      if (provaError) throw provaError;
      setProva(provaData);

      // ALTERADO: Query simplificada sem relações aninhadas
      const { data: questoesData, error: questoesError } = await supabase
        .from('questoes')
        .select('*') // Apenas selecione todas as colunas, incluindo os IDs numéricos
        .eq('prova', parseInt(provaId))
        .order('numero', { ascending: true });

      if (questoesError) throw questoesError;

      const questaoIds = questoesData.map(q => q.id);
      let questoesWithAlternatives: Questao[] = [];

      if (questaoIds.length > 0) {
        const { data: alternativasData, error: alternativasError } = await supabase
          .from('alternativas')
          .select('*')
          .in('questao', questaoIds)
          .order('id', { ascending: true });

        if (alternativasError) throw alternativasError;

        questoesWithAlternatives = questoesData.map(questao => ({
          ...questao,
          alternativas: alternativasData.filter(alt => alt.questao === questao.id)
        }));
      } else {
        questoesWithAlternatives = questoesData;
      }

      setQuestoes(questoesWithAlternatives);

      if (questoesWithAlternatives.length > 0 && !activeQuestaoId && !isEditingActiveQuestao) {
        setActiveQuestaoId(questoesWithAlternatives[0].id);
      } else if (questoesWithAlternatives.length === 0) {
        setActiveQuestaoId(null);
      }

    } catch (err: any) {
      console.error('Erro ao carregar editor de questões:', err);
      setError(err.message || 'Erro desconhecido ao carregar questões.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    setCategoryError(null);
    const { data, error } = await supabase.from('categoria').select('id, nome, abrev, cor_background').order('nome');
    if (error) {
      console.error('Erro ao buscar categorias:', error);
      setCategoryError(error.message);
    } else {
      setAllCategories(data || []);
    }
    setLoadingCategories(false);
  }, []);

  // RENOMEADO: fetchFilteredSubcategories (para dropdown)
  const fetchFilteredSubcategories = useCallback(async (categoryId: number) => {
    setLoadingSubcategories(true);
    setSubcategoryError(null);
    const { data, error } = await supabase.from('subcategoria').select('id, nome, categoria').eq('categoria', categoryId).order('nome');
    if (error) {
      console.error('Erro ao buscar subcategorias para dropdown:', error);
      setSubcategoryError(error.message);
    } else {
      setFilteredSubcategories(data || []);
    }
    setLoadingSubcategories(false);
  }, []);

  // NOVO: fetchSubcategoriesAll (para lookup de nomes)
  const fetchSubcategoriesAll = useCallback(async () => {
    setLoadingAllSubcategories(true);
    const { data, error } = await supabase.from('subcategoria').select('id, nome, categoria').order('nome');
    if (error) {
      console.error('Erro ao buscar todas as subcategorias:', error);
    } else {
      setAllSubcategories(data || []);
    }
    setLoadingAllSubcategories(false);
  }, []);

  // RENOMEADO: fetchFilteredAssuntos (para dropdown)
  const fetchFilteredAssuntos = useCallback(async (subcategoryId: number) => {
    setLoadingAssuntos(true);
    setAssuntoError(null);
    const { data, error } = await supabase.from('assunto').select('id, nome, categoria, subcategoria, tempo_de_aula').eq('subcategoria', subcategoryId).order('nome');
    if (error) {
      console.error('Erro ao buscar assuntos para dropdown:', error);
      setAssuntoError(error.message);
    } else {
      setFilteredAssuntos(data || []);
    }
    setLoadingAssuntos(false);
  }, []);

  // NOVO: fetchAssuntosAll (para lookup de nomes)
  const fetchAssuntosAll = useCallback(async () => {
    setLoadingAllAssuntos(true);
    const { data, error } = await supabase.from('assunto').select('id, nome, categoria, subcategoria, tempo_de_aula').order('nome');
    if (error) {
      console.error('Erro ao buscar todos os assuntos:', error);
    } else {
      setAllAssuntos(data || []);
    }
    setLoadingAllAssuntos(false);
  }, []);


  useEffect(() => {
    fetchProvaAndQuestoes();
    fetchCategories();
    fetchSubcategoriesAll(); // NOVO: Buscar todas as subcategorias
    fetchAssuntosAll(); // NOVO: Buscar todos os assuntos
  }, [provaId, fetchCategories, fetchSubcategoriesAll, fetchAssuntosAll]);

  useEffect(() => {
    if (editingFormData?.categoria) {
      fetchFilteredSubcategories(editingFormData.categoria); // ALTERADO: Usar fetchFilteredSubcategories
    } else {
      setFilteredSubcategories([]);
      setEditingFormData(prev => prev ? { ...prev, subcategoria: null, assunto: null } : null);
    }
  }, [editingFormData?.categoria, fetchFilteredSubcategories]); // ALTERADO: Dependência

  useEffect(() => {
    if (editingFormData?.subcategoria) {
      fetchFilteredAssuntos(editingFormData.subcategoria); // ALTERADO: Usar fetchFilteredAssuntos
    } else {
      setFilteredAssuntos([]);
      setEditingFormData(prev => prev ? { ...prev, assunto: null } : null);
    }
  }, [editingFormData?.subcategoria, fetchFilteredAssuntos]); // ALTERADO: Dependência


  const handleCopyId = (id: number | null) => {
    if (id === null) return;
    navigator.clipboard.writeText(id.toString());
    setCopyFeedback('Copiado!');
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleAddQuestao = () => {
    setIsEditingActiveQuestao(true);
    setEditingFormData({
      id: null,
      enunciado: '',
      comentario: null,
      numero: null,
      discursiva: false,
      anulada: false,
      assunto: null,
      categoria: null,
      subcategoria: null,
      ano: null,
      dif_q: null,
      foco: null,
      imagens_enunciado: null,
      newEnunciadoFiles: [],
      removedEnunciadoUrls: [],
      alternativas: [],
    });
    setErrors({});
    setNextAltId(-1);
    setActiveQuestaoId(null);
  };

  const handleEditQuestao = (questao: Questao) => {
    setIsEditingActiveQuestao(true);
    const formData = mapQuestaoToQuestaoForm(questao);
    setEditingFormData(formData);
    setErrors({});
    // CORRIGIDO: Math.max (minúsculo)
    const maxExistingAltId = questao.alternativas?.reduce((max, alt) => Math.max(max, alt.id || 0), 0) || 0;
    setNextAltId(maxExistingAltId > 0 ? -1 : -1);
    setActiveQuestaoId(questao.id);

    if (formData.categoria) {
      fetchFilteredSubcategories(formData.categoria); // ALTERADO: Usar fetchFilteredSubcategories
    } else {
      setFilteredSubcategories([]);
    }
    if (formData.subcategoria) {
      fetchFilteredAssuntos(formData.subcategoria); // ALTERADO: Usar fetchFilteredAssuntos
    } else {
      setFilteredAssuntos([]);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingActiveQuestao(false);
    setEditingFormData(null);
    setErrors({});
    if (activeQuestaoId) {
      // Already active, just exit edit mode
    } else if (questoes.length > 0) {
      setActiveQuestaoId(questoes[0].id);
    } else {
      setActiveQuestaoId(null);
    }
  };

  const handleSaveQuestao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFormData) return;

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let currentQuestaoId = editingFormData.id;

      // --- 1. Gerenciar Imagens do Enunciado ---
      let finalEnunciadoImages: string[] = editingFormData.imagens_enunciado || [];

      if (editingFormData.removedEnunciadoUrls && editingFormData.removedEnunciadoUrls.length > 0) {
        const { error: removeError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(editingFormData.removedEnunciadoUrls.map(url => url.split('/').pop()!));
        if (removeError) console.error('Erro ao remover imagem do enunciado:', removeError);
      }

      if (editingFormData.newEnunciadoFiles && editingFormData.newEnunciadoFiles.length > 0) {
        for (const file of editingFormData.newEnunciadoFiles) {
          const filePath = `questoes/${currentQuestaoId || 'new'}/enunciado/${file.name}`;
          const { data, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false,
            });
          if (uploadError) {
            console.error('Erro ao fazer upload da imagem do enunciado:', uploadError);
            setError(`Erro ao fazer upload da imagem: ${uploadError.message}`);
            setLoading(false);
            return;
          }
          const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
          if (publicUrlData) {
            finalEnunciadoImages.push(publicUrlData.publicUrl);
          }
        }
      }
      finalEnunciadoImages = finalEnunciadoImages.filter(url => !(editingFormData.removedEnunciadoUrls || []).includes(url));


      // --- 2. Salvar/Atualizar Questão (dados básicos e imagens do enunciado) ---
      const questaoToSave = {
        enunciado: editingFormData.enunciado,
        comentario: editingFormData.comentario,
        numero: editingFormData.numero,
        discursiva: editingFormData.discursiva,
        anulada: editingFormData.anulada,
        assunto: editingFormData.assunto,
        categoria: editingFormData.categoria,
        subcategoria: editingFormData.subcategoria,
        ano: editingFormData.ano,
        dif_q: editingFormData.dif_q,
        foco: editingFormData.foco,
        imagens_enunciado: finalEnunciadoImages,
        prova: parseInt(provaId!),
        instituicao: parseInt(institutionId!),
      };

      let questaoResult;
      if (currentQuestaoId) {
        questaoResult = await supabase
          .from('questoes')
          .update(questaoToSave)
          .eq('id', currentQuestaoId)
          .select()
          .single();
      } else {
        questaoResult = await supabase
          .from('questoes')
          .insert(questaoToSave)
          .select()
          .single();
      }

      if (questaoResult.error) throw questaoResult.error;
      currentQuestaoId = questaoResult.data.id;

      let correctAlternativeId: number | null = null;

      // --- 3. Lidar com Alternativas ---
      if (!editingFormData.discursiva) {
        const { data: existingAlts, error: fetchExistingAltsError } = await supabase
          .from('alternativas')
          .select('id, imagens')
          .eq('questao', currentQuestaoId);
        if (fetchExistingAltsError) throw fetchExistingAltsError;
        const existingAlternativeIds = existingAlts.map(alt => alt.id);

        const formAlternativeIds = editingFormData.alternativas.map(alt => alt.id).filter(id => id !== null && id > 0) as number[];

        const alternativesToDelete = existingAlternativeIds.filter(id => !formAlternativeIds.includes(id));
        if (alternativesToDelete.length > 0) {
          const urlsToRemoveFromDeletedAlts = existingAlts
            .filter(alt => alternativesToDelete.includes(alt.id))
            .flatMap(alt => alt.imagens || [])
            .map(url => url.split('/').pop()!);

          if (urlsToRemoveFromDeletedAlts.length > 0) {
            const { error: removeAltImgError } = await supabase.storage
              .from(BUCKET_NAME)
              .remove(urlsToRemoveFromDeletedAlts);
            if (removeAltImgError) console.error('Erro ao remover imagens de alternativas deletadas:', removeAltImgError);
          }

          const { error: deleteError } = await supabase
            .from('alternativas')
            .delete()
            .in('id', alternativesToDelete);
          if (deleteError) throw deleteError;
        }

        for (const alt of editingFormData.alternativas) {
          let finalAlternativeImages: string[] = alt.imagens || [];

          if (alt.removedUrls && alt.removedUrls.length > 0) {
            const { error: removeAltImgError } = await supabase.storage
              .from(BUCKET_NAME)
              .remove(alt.removedUrls.map(url => url.split('/').pop()!));
            if (removeAltImgError) console.error('Erro ao remover imagem da alternativa:', removeAltImgError);
          }

          if (alt.newFiles && alt.newFiles.length > 0) {
            for (const file of alt.newFiles) {
              const filePath = `questoes/${currentQuestaoId}/alternativas/${alt.id || 'new'}/${file.name}`;
              const { data, error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(filePath, file, {
                  cacheControl: '3600',
                  upsert: false,
                });
              if (uploadError) {
                console.error('Erro ao fazer upload da imagem da alternativa:', uploadError);
                setError(`Erro ao fazer upload da imagem da alternativa: ${uploadError.message}`);
                setLoading(false);
                return;
              }
              const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
              if (publicUrlData) {
                finalAlternativeImages.push(publicUrlData.publicUrl);
              }
            }
          }
          finalAlternativeImages = finalAlternativeImages.filter(url => !(alt.removedUrls || []).includes(url));


          const alternativeToSave = {
            alternativa_txt: alt.alternativa_txt,
            comentario: alt.comentario,
            correta: alt.correta,
            imagens: finalAlternativeImages,
            questao: currentQuestaoId,
          };

          let savedAlt;
          if (alt.id && alt.id > 0) {
            const { data, error: updateAltError } = await supabase
              .from('alternativas')
              .update(alternativeToSave)
              .eq('id', alt.id)
              .select()
              .single();
            if (updateAltError) throw updateAltError;
            savedAlt = data;
          } else {
            const { data, error: insertAltError } = await supabase
              .from('alternativas')
              .insert(alternativeToSave)
              .select()
              .single();
            if (insertAltError) throw insertAltError;
            savedAlt = data;
          }

          if (alt.correta && savedAlt && !editingFormData.anulada) {
            correctAlternativeId = savedAlt.id;
          }
        }
      }

      // --- 4. Atualizar alternativa_Correta na Questão principal ---
      const finalCorrectAlternativeId = (editingFormData.discursiva || editingFormData.anulada)
        ? null
        : correctAlternativeId;

      const { error: updateQuestaoCorrectAltError } = await supabase
        .from('questoes')
        .update({ alternativa_Correta: finalCorrectAlternativeId })
        .eq('id', currentQuestaoId);
      if (updateQuestaoCorrectAltError) throw updateQuestaoCorrectAltError;

      setIsEditingActiveQuestao(false);
      setEditingFormData(null);
      fetchProvaAndQuestoes();
      setActiveQuestaoId(currentQuestaoId);
    } catch (err: any) {
      console.error('Erro ao salvar questão:', err);
      setError(err.message || 'Erro desconhecido ao salvar questão.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestaoClick = (questao: Questao) => {
    setQuestaoToDelete(questao);
    setIsConfirmDeleteQuestaoModalOpen(true);
  };

  const handleConfirmDeleteQuestao = async () => {
    if (!questaoToDelete) return;

    setIsConfirmDeleteQuestaoModalOpen(false);
    setLoading(true);
    setError(null);

    try {
      const urlsToRemove: string[] = [];
      if (questaoToDelete.imagens_enunciado) {
        urlsToRemove.push(...questaoToDelete.imagens_enunciado.map(url => url.split('/').pop()!));
      }
      if (questaoToDelete.alternativas) {
        questaoToDelete.alternativas.forEach(alt => {
          if (alt.imagens) {
            urlsToRemove.push(...alt.imagens.map(url => url.split('/').pop()!));
          }
        });
      }

      if (urlsToRemove.length > 0) {
        const { error: removeStorageError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(urlsToRemove);
        if (removeStorageError) console.error('Erro ao remover imagens do storage ao deletar questão:', removeStorageError);
      }

      const { error: deleteQuestaoError } = await supabase
        .from('questoes')
        .delete()
        .eq('id', questaoToDelete.id);
      if (deleteQuestaoError) throw deleteQuestaoError;

      fetchProvaAndQuestoes();
      setActiveQuestaoId(null);
    } catch (err: any) {
      console.error('Erro ao deletar questão:', err);
      setError(err.message || 'Erro desconhecido ao deletar questão.');
    } finally {
      setLoading(false);
      setQuestaoToDelete(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setEditingFormData(prev => prev ? ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? null : Number(value)) : value,
    }) : null);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEditingFormData(prev => prev ? ({
      ...prev,
      [name]: checked,
    }) : null);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingFormData(prev => prev ? ({
      ...prev,
      [name]: value === '' ? null : Number(value),
    }) : null);
  };

  const handleAlternativeChange = (index: number, field: keyof AlternativaForm, value: any) => {
    setEditingFormData(prev => {
      if (!prev) return null;
      const newAlternatives = [...prev.alternativas];
      newAlternatives[index] = { ...newAlternatives[index], [field]: value };
      return { ...prev, alternativas: newAlternatives };
    });
  };

  const handleCorrectAlternativeChange = (index: number) => {
    setEditingFormData(prev => {
      if (!prev) return null;
      const newAlternatives = prev.alternativas.map((alt, i) => ({
        ...alt,
        correta: i === index,
      }));
      return { ...prev, alternativas: newAlternatives };
    });
  };

  const handleAddAlternative = () => {
    setEditingFormData(prev => {
      if (!prev) return null;
      const newIndex = prev.alternativas.length;
      const newLetter = String.fromCharCode(65 + newIndex);
      const defaultText = `${newLetter}) `;

      return {
        ...prev,
        alternativas: [
          ...prev.alternativas,
          { id: nextAltId, alternativa_txt: defaultText, correta: false, comentario: null, imagens: null, newFiles: [], removedUrls: [] },
        ],
      };
    });
    setNextAltId(prev => prev - 1);
  };

  const handleRemoveAlternativeUrl = (index: number, urlToRemove: string) => {
    setEditingFormData(prev => {
      if (!prev) return null;
      const newAlternatives = [...prev.alternativas];
      newAlternatives[index] = {
        ...newAlternatives[index],
        imagens: (newAlternatives[index].imagens || []).filter(url => url !== urlToRemove),
        removedUrls: [...(newAlternatives[index].removedUrls || []), urlToRemove],
      };
      return { ...prev, alternativas: newAlternatives };
    });
  };

  const handleRemoveNewAlternativeFile = (altIndex: number, fileToRemove: File) => {
    setEditingFormData(prev => {
      if (!prev) return null;
      const newAlternatives = [...prev.alternativas];
      newAlternatives[altIndex] = {
        ...newAlternatives[altIndex],
        newFiles: (newAlternatives[altIndex].newFiles || []).filter(file => file !== fileToRemove),
      };
      return { ...prev, alternativas: newAlternatives };
    });
  };

  const handleRemoveAlternative = (index: number) => {
    const altToRemove = editingFormData?.alternativas[index];
    if (altToRemove && altToRemove.id && altToRemove.id > 0) {
      setAlternativeToDeleteInfo({ index, id: altToRemove.id, text: altToRemove.alternativa_txt || 'esta alternativa' });
      setIsConfirmDeleteAlternativeModalOpen(true);
    } else {
      setEditingFormData(prev => {
        if (!prev) return null;
        const newAlternatives = prev.alternativas.filter((_, i) => i !== index);
        return { ...prev, alternativas: newAlternatives };
      });
    }
  };

  const handleConfirmDeleteAlternative = () => {
    if (!alternativeToDeleteInfo || !editingFormData) return;

    const { index } = alternativeToDeleteInfo;

    setEditingFormData(prev => {
      if (!prev) return null;
      const newAlternatives = prev.alternativas.filter((_, i) => i !== index);
      const removedAlt = prev.alternativas[index];
      if (removedAlt && removedAlt.imagens) {
        // This logic is handled by the main save function's alternativesToDelete
        // when it compares existing IDs with form IDs.
      }
      return { ...prev, alternativas: newAlternatives };
    });

    setIsConfirmDeleteAlternativeModalOpen(false);
    setAlternativeToDeleteInfo(null);
  };

  const handleEnunciadoImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setEditingFormData(prev => prev ? ({
      ...prev,
      newEnunciadoFiles: [...(prev.newEnunciadoFiles || []), ...files],
    }) : null);
  };

  const handleRemoveEnunciadoUrl = (urlToRemove: string) => {
    setEditingFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        imagens_enunciado: (prev.imagens_enunciado || []).filter(url => url !== urlToRemove),
        removedEnunciadoUrls: [...(prev.removedEnunciadoUrls || []), urlToRemove],
      };
    });
  };

  const handleRemoveNewEnunciadoFile = (fileToRemove: File) => {
    setEditingFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        newEnunciadoFiles: (prev.newEnunciadoFiles || []).filter(file => file !== fileToRemove),
      };
    });
  };

  const handleAlternativeImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setEditingFormData(prev => {
      if (!prev) return null;
      const newAlternatives = [...prev.alternativas];
      newAlternatives[index] = {
        ...newAlternatives[index],
        newFiles: [...(newAlternatives[index].newFiles || []), ...files],
      };
      return { ...prev, alternativas: newAlternatives };
    });
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!editingFormData?.enunciado.trim()) {
      newErrors.enunciado = 'O enunciado da questão é obrigatório.';
    }
    if (!editingFormData?.discursiva && !editingFormData?.anulada) {
      if (editingFormData?.alternativas.length < 2) {
        newErrors.alternativas = 'Para questões objetivas, são necessárias pelo menos duas alternativas.';
      }
      if (!editingFormData?.alternativas.some(alt => alt.correta)) {
        newErrors.correta = 'Para questões objetivas, uma alternativa correta deve ser selecionada.';
      }
      if (editingFormData?.alternativas.some(alt => !alt.alternativa_txt.trim())) {
        newErrors.alternativas = 'Todas as alternativas devem ter texto.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
      <div className="flex items-center justify-center min-h-[calc(10vh-150px)] text-text">
        <p className="text-xl font-medium animate-pulse">Carregando dados...</p>
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
            <Info className="w-16 h-16 text-primary mb-6 opacity-70" />
            <p className="text-xl font-medium mb-2">Nenhuma questão encontrada para esta prova.</p>
            <p className="text-md">Clique em "Nova Questão" para adicionar a primeira.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {isEditingActiveQuestao && editingFormData ? (
              // Formulário de Edição/Criação de Questão
              <form onSubmit={handleSaveQuestao} className="bg-surface border border-border rounded-xl p-6 shadow-md">
                <div className="flex items-center justify-between pb-6 border-b border-border/50 mb-6">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
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
                  {/* NOVO: Campos de Categoria, Subcategoria, Assunto - MOVIDO PARA CIMA */}
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
                    <textarea
                      id="comentario"
                      name="comentario"
                      value={editingFormData.comentario || ''}
                      onChange={handleChange}
                      rows={3}
                      className="w-full p-3 bg-background border border-border rounded-lg text-text placeholder-textSecondary focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ease-in-out resize-y"
                      placeholder="Adicione um comentário ou explicação sobre a questão..."
                      disabled={loading}
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
              </form>
            ) : (
              // Visualização da Questão Ativa
              activeQuestao ? (
                <div key={activeQuestao.id} id={`questao-${activeQuestao.id}`} className="bg-surface border border-border rounded-xl p-6 shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-text">Questão {activeQuestao.numero || (questoes.indexOf(activeQuestao) + 1)} <span className="text-textSecondary text-sm font-normal">(ID: {activeQuestao.id})</span></h3>
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
                        onClick={() => handleEditQuestao(activeQuestao)}
                        className="p-2 rounded-full text-textSecondary hover:bg-primary/20 hover:text-primary transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface transform hover:scale-110"
                        aria-label="Editar questão"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestaoClick(activeQuestao)}
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
                    {/* NOVO: Exibir Categoria, Subcategoria, Assunto */}
                    <div className="mt-4 text-sm text-textSecondary space-y-1">
                      {activeQuestao.categoria && allCategories.find(c => c.id === activeQuestao.categoria)?.nome && (
                        <p>
                          <span className="font-semibold text-text">Categoria:</span> {allCategories.find(c => c.id === activeQuestao.categoria)?.nome}
                        </p>
                      )}
                      {activeQuestao.subcategoria && allSubcategories.find(s => s.id === activeQuestao.subcategoria)?.nome && (
                        <p>
                          <span className="font-semibold text-text">Subcategoria:</span> {allSubcategories.find(s => s.id === activeQuestao.subcategoria)?.nome}
                        </p>
                      )}
                      {activeQuestao.assunto && allAssuntos.find(a => a.id === activeQuestao.assunto)?.nome && (
                        <p>
                          <span className="font-semibold text-text">Assunto:</span> {allAssuntos.find(a => a.id === activeQuestao.assunto)?.nome}
                        </p>
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
                  {/* MOVIDO: Comentário da Questão */}
                  {activeQuestao.comentario && (
                    <div className="mt-4 p-3 bg-background rounded-lg border border-border text-sm">
                      <p className="font-semibold text-text">Comentário:</p>
                      <p>{activeQuestao.comentario}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-textSecondary p-12 bg-surface rounded-xl shadow-lg flex flex-col items-center justify-center">
                  <Info className="w-16 h-16 text-primary mb-6 opacity-70" />
                  <p className="text-xl font-medium mb-2">Selecione uma questão.</p>
                  <p className="text-md">Use o painel de navegação à direita para escolher uma questão.</p>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Painel de Navegação Rápida (Quadradinho) */}
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

      {/* Modal de Confirmação para Excluir Alternativa */}
      {isConfirmDeleteAlternativeModalOpen && alternativeToDeleteInfo && (
        <ConfirmationModal
          isOpen={isConfirmDeleteAlternativeModalOpen}
          onClose={() => {
            setIsConfirmDeleteAlternativeModalOpen(false);
            setAlternativeToDeleteInfo(null);
          }}
          onConfirm={handleConfirmDeleteAlternative}
          title="Confirmar Remoção de Alternativa"
          message={`Você está prestes a remover "${alternativeToDeleteInfo.text}" (ID: ${alternativeToDeleteInfo.id}). Esta alternativa será permanentemente excluída do banco de dados quando você salvar a questão. Esta ação é irreversível após o salvamento.`}
          expectedText="remover alternativa"
        />
      )}
    </div>
  );
};

export default QuestaoEditor;
