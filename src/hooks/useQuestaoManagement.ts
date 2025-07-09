// src/hooks/useQuestaoManagement.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Questao, Prova, Alternativa, QuestaoFormData, AlternativaForm } from '../types';

const BUCKET_NAME = 'question-images';

export const useQuestaoManagement = (institutionId: string, provaId: string) => {
  const [prova, setProva] = useState<Prova | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditingActiveQuestao, setIsEditingActiveQuestao] = useState(false);
  const [editingFormData, setEditingFormData] = useState<QuestaoFormData | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [nextAltId, setNextAltId] = useState(-1); // Used for new alternatives before they have a DB ID
  const [originalAlternatives, setOriginalAlternatives] = useState<Alternativa[]>([]); // Store original alternatives for comparison

  const [isConfirmDeleteQuestaoModalOpen, setIsConfirmDeleteQuestaoModalOpen] = useState(false);
  const [questaoToDelete, setQuestaoToDelete] = useState<Questao | null>(null);

  const [isConfirmDeleteAlternativeModalOpen, setIsConfirmDeleteAlternativeModalOpen] = useState(false);
  const [alternativeToDeleteInfo, setAlternativeToDeleteInfo] = useState<{ index: number; id: number | null; text: string } | null>(null);

  const [activeQuestaoId, setActiveQuestaoId] = useState<number | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Helper function to map Questao to QuestaoFormData
  const mapQuestaoToQuestaoForm = useCallback((questao: Questao): QuestaoFormData => ({
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
  }), []);

  const fetchProvaAndQuestoes = useCallback(async () => {
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

      const { data: questoesData, error: questoesError } = await supabase
        .from('questoes')
        .select('*')
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

      // Only set activeQuestaoId if it's not already set and not in editing mode
      // This prevents re-fetching when activeQuestaoId changes due to user interaction
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
  }, [provaId]); // Removed activeQuestaoId and isEditingActiveQuestao from dependencies

  useEffect(() => {
    fetchProvaAndQuestoes();
  }, [provaId, fetchProvaAndQuestoes]);

  const handleCopyId = useCallback((id: number | null) => {
    if (id === null) return;
    navigator.clipboard.writeText(id.toString());
    setCopyFeedback('Copiado!');
    setTimeout(() => setCopyFeedback(null), 2000);
  }, []);

  const handleAddQuestao = useCallback(() => {
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
    setOriginalAlternatives([]); // Clear original alternatives for new question
  }, []);

  const handleEditQuestao = useCallback((questao: Questao) => {
    setIsEditingActiveQuestao(true);
    const formData = mapQuestaoToQuestaoForm(questao);
    setEditingFormData(formData);
    setErrors({});
    // Store original alternatives for comparison during save
    setOriginalAlternatives(questao.alternativas || []);
    const maxExistingAltId = questao.alternativas?.reduce((max, alt) => Math.max(max, alt.id || 0), 0) || 0;
    setNextAltId(maxExistingAltId > 0 ? -1 : -1);
    setActiveQuestaoId(questao.id);
  }, [mapQuestaoToQuestaoForm]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingActiveQuestao(false);
    setEditingFormData(null);
    setErrors({});
    setOriginalAlternatives([]); // Clear original alternatives on cancel
    if (activeQuestaoId) {
      // Already active, just exit edit mode
    } else if (questoes.length > 0) {
      setActiveQuestaoId(questoes[0].id);
    } else {
      setActiveQuestaoId(null);
    }
  }, [activeQuestaoId, questoes.length]);

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!editingFormData?.enunciado.trim()) {
      newErrors.enunciado = 'O enunciado da questão é obrigatório.';
    }
    // Validation for objective questions (not discursive AND not annulled)
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
  }, [editingFormData]);

  const handleSaveQuestao = useCallback(async (e: React.FormEvent) => {
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
          // Ensure a unique path for new enunciado files, especially if questaoId is null (new question)
          const filePath = `questoes/${currentQuestaoId || 'new-' + file.name + Date.now()}/enunciado/${file.name}`;
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

      // --- Determine alternativa_Correta para o DB (não limpar para discursiva/anulada) ---
      let alternativa_Correta_for_db: number | null = null;
      // Only set correct alternative if it's not discursive AND not annulled
      if (!editingFormData.discursiva && !editingFormData.anulada) {
        const selectedAlt = editingFormData.alternativas.find(alt => alt.correta);
        if (selectedAlt && selectedAlt.id && selectedAlt.id > 0) {
          alternativa_Correta_for_db = selectedAlt.id;
        }
      } else {
        // If discursive or annulled, preserve the existing correct alternative ID from the original data
        // This ensures it's not set to NULL if it was previously set.
        const originalQuestao = questoes.find(q => q.id === editingFormData.id);
        alternativa_Correta_for_db = originalQuestao?.alternativa_Correta || null;
      }


      // --- 2. Salvar/Atualizar Questão (dados básicos, imagens do enunciado e ID da alternativa correta) ---
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
        alternativa_Correta: alternativa_Correta_for_db,
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

      // --- 3. Lidar com Alternativas (sempre, independente de discursiva/anulada) ---

      // Identify alternatives to delete (present in original, but not in current form data)
      const currentAlternativeIds = new Set(editingFormData.alternativas.filter(alt => alt.id && alt.id > 0).map(alt => alt.id!));
      const alternativesToDeleteIds = originalAlternatives
        .filter(alt => alt.id && !currentAlternativeIds.has(alt.id))
        .map(alt => alt.id!);

      if (alternativesToDeleteIds.length > 0) {
        // Fetch images associated with alternatives to be deleted
        const urlsToRemoveFromDeletedAlts = originalAlternatives
          .filter(alt => alternativesToDeleteIds.includes(alt.id!))
          .flatMap(alt => alt.imagens || [])
          .map(url => url.split('/').pop()!);

        if (urlsToRemoveFromDeletedAlts.length > 0) {
          const { error: removeAltImgError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove(urlsToRemoveFromDeletedAlts);
          if (removeAltImgError) console.error('Erro ao remover imagens de alternativas deletadas:', removeAltImgError);
        }

        // Delete alternatives from the database
        const { error: deleteError } = await supabase
          .from('alternativas')
          .delete()
          .in('id', alternativesToDeleteIds);
        if (deleteError) throw deleteError;
      }

      // Process remaining alternatives (insert new ones, update existing ones)
      for (const alt of editingFormData.alternativas) {
        let finalAlternativeImages: string[] = alt.imagens || [];

        // Handle removed URLs for this specific alternative
        if (alt.removedUrls && alt.removedUrls.length > 0) {
          const { error: removeAltImgError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove(alt.removedUrls.map(url => url.split('/').pop()!));
          if (removeAltImgError) console.error('Erro ao remover imagem da alternativa:', removeAltImgError);
        }

        // Handle new files for this specific alternative
        if (alt.newFiles && alt.newFiles.length > 0) {
          for (const file of alt.newFiles) {
            // Ensure unique path for new files, especially if alt.id is negative (new alternative)
            const filePath = `questoes/${currentQuestaoId}/alternativas/${alt.id && alt.id > 0 ? alt.id : 'new-' + file.name + Date.now()}/${file.name}`;
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

        if (alt.id && alt.id > 0) {
          // Update existing alternative
          const { data, error: updateAltError } = await supabase
            .from('alternativas')
            .update(alternativeToSave)
            .eq('id', alt.id)
            .select()
            .single();
          if (updateAltError) throw updateAltError;
        } else {
          // Insert new alternative
          const { data, error: insertAltError } = await supabase
            .from('alternativas')
            .insert(alternativeToSave)
            .select()
            .single();
          if (insertAltError) throw insertAltError;
        }
      }

      setIsEditingActiveQuestao(false);
      setEditingFormData(null);
      setOriginalAlternatives([]); // Clear original alternatives after successful save
      fetchProvaAndQuestoes();
      setActiveQuestaoId(currentQuestaoId);
    } catch (err: any) {
      console.error('Erro ao salvar questão:', err);
      setError(err.message || 'Erro desconhecido ao salvar questão.');
    } finally {
      setLoading(false);
    }
  }, [editingFormData, validateForm, provaId, institutionId, fetchProvaAndQuestoes, originalAlternatives, questoes]);

  const handleDeleteQuestaoClick = useCallback((questao: Questao) => {
    setQuestaoToDelete(questao);
    setIsConfirmDeleteQuestaoModalOpen(true);
  }, []);

  const handleConfirmDeleteQuestao = useCallback(async () => {
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
  }, [questaoToDelete, fetchProvaAndQuestoes]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setEditingFormData(prev => prev ? ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? null : Number(value)) : value,
    }) : null);
  }, []);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    setEditingFormData(prev => {
      if (!prev) return null;

      if (name === 'discursiva') {
        // When marking as discursive, ensure correct alternative is not selected in UI
        // but do NOT clear the underlying data.
        if (checked) {
          const newAlternatives = prev.alternativas.map(alt => ({ ...alt, correta: false }));
          return { ...prev, [name]: checked, alternativas: newAlternatives };
        } else {
          // When unmarking discursive, the correct alternative will be restored from DB on next fetch
          // or can be re-selected by user. No special handling needed here.
          return { ...prev, [name]: checked };
        }
      }
      // For other checkboxes (like 'anulada'), just update normally
      return { ...prev, [name]: checked };
    });
  }, []);

  const handleSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingFormData(prev => prev ? ({
      ...prev,
      [name]: value === '' ? null : Number(value),
    }) : null);
  }, []);

  const handleAlternativeChange = useCallback((index: number, field: keyof AlternativaForm, value: any) => {
    setEditingFormData(prev => {
      if (!prev) return null;
      const newAlternatives = [...prev.alternativas];
      newAlternatives[index] = { ...newAlternatives[index], [field]: value };
      return { ...prev, alternativas: newAlternatives };
    });
  }, []);

  const handleCorrectAlternativeChange = useCallback((index: number) => {
    setEditingFormData(prev => {
      if (!prev) return null;
      const newAlternatives = prev.alternativas.map((alt, i) => ({
        ...alt,
        correta: i === index,
      }));
      return { ...prev, alternativas: newAlternatives };
    });
  }, []);

  const handleAddAlternative = useCallback(() => {
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
  }, [nextAltId]);

  const handleRemoveAlternativeUrl = useCallback((index: number, urlToRemove: string) => {
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
  }, []);

  const handleRemoveNewAlternativeFile = useCallback((altIndex: number, fileToRemove: File) => {
    setEditingFormData(prev => {
      if (!prev) return null;
      const newAlternatives = [...prev.alternativas];
      newAlternatives[altIndex] = {
        ...newAlternatives[altIndex],
        newFiles: (newAlternatives[altIndex].newFiles || []).filter(file => file !== fileToRemove),
      };
      return { ...prev, alternativas: newAlternatives };
    });
  }, []);

  const handleRemoveAlternative = useCallback((index: number) => {
    const altToRemove = editingFormData?.alternativas[index];
    if (altToRemove && altToRemove.id && altToRemove.id > 0) {
      // If it's an existing alternative, open confirmation modal
      setAlternativeToDeleteInfo({ index, id: altToRemove.id, text: altToRemove.alternativa_txt || 'esta alternativa' });
      setIsConfirmDeleteAlternativeModalOpen(true);
    } else {
      // If it's a newly added alternative (id < 0), remove directly without modal
      setEditingFormData(prev => {
        if (!prev) return null;
        const newAlternatives = prev.alternativas.filter((_, i) => i !== index);
        return { ...prev, alternativas: newAlternatives };
      });
    }
  }, [editingFormData]);

  const handleConfirmDeleteAlternative = useCallback(() => {
    if (!alternativeToDeleteInfo || !editingFormData) return;

    const { index } = alternativeToDeleteInfo;

    setEditingFormData(prev => {
      if (!prev) return null;
      const newAlternatives = prev.alternativas.filter((_, i) => i !== index);
      // The actual deletion from DB will happen in handleSaveQuestao by comparing with originalAlternatives
      return { ...prev, alternativas: newAlternatives };
    });

    setIsConfirmDeleteAlternativeModalOpen(false);
    setAlternativeToDeleteInfo(null);
  }, [alternativeToDeleteInfo, editingFormData]);

  const handleEnunciadoImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setEditingFormData(prev => prev ? ({
      ...prev,
      newEnunciadoFiles: [...(prev.newEnunciadoFiles || []), ...files],
    }) : null);
  }, []);

  const handleRemoveEnunciadoUrl = useCallback((urlToRemove: string) => {
    setEditingFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        imagens_enunciado: (prev.imagens_enunciado || []).filter(url => url !== urlToRemove),
        removedEnunciadoUrls: [...(prev.removedEnunciadoUrls || []), urlToRemove],
      };
    });
  }, []);

  const handleRemoveNewEnunciadoFile = useCallback((fileToRemove: File) => {
    setEditingFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        newEnunciadoFiles: (prev.newEnunciadoFiles || []).filter(file => file !== fileToRemove),
      };
    });
  }, []);

  const handleAlternativeImageChange = useCallback((index: number, e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, []);

  return {
    prova,
    questoes,
    loading,
    error,
    isEditingActiveQuestao,
    editingFormData,
    setEditingFormData,
    errors,
    nextAltId,
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
    validateForm,
  };
};
