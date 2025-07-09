// src/hooks/useTaxonomyData.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Categoria, Subcategoria, Assunto } from '../types';

export const useTaxonomyData = () => {
  const [allCategories, setAllCategories] = useState<Categoria[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategoria[]>([]);
  const [filteredAssuntos, setFilteredAssuntos] = useState<Assunto[]>([]);

  const [allSubcategories, setAllSubcategories] = useState<Subcategoria[]>([]);
  const [allAssuntos, setAllAssuntos] = useState<Assunto[]>([]);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [loadingAssuntos, setLoadingAssuntos] = useState(false);
  const [loadingAllSubcategories, setLoadingAllSubcategories] = useState(false);
  const [loadingAllAssuntos, setLoadingAllAssuntos] = useState(false);

  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [subcategoryError, setSubcategoryError] = useState<string | null>(null);
  const [assuntoError, setAssuntoError] = useState<string | null>(null);

  const categoryMap = useMemo(() => {
    return new Map(allCategories.map(cat => [cat.id, cat.nome]));
  }, [allCategories]);

  const subcategoryMap = useMemo(() => {
    return new Map(allSubcategories.map(subcat => [subcat.id, subcat.nome]));
  }, [allSubcategories]);

  const assuntoMap = useMemo(() => {
    return new Map(allAssuntos.map(ass => [ass.id, ass.nome]));
  }, [allAssuntos]);

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
    fetchCategories();
    fetchSubcategoriesAll();
    fetchAssuntosAll();
  }, [fetchCategories, fetchSubcategoriesAll, fetchAssuntosAll]);

  return {
    allCategories,
    filteredSubcategories,
    filteredAssuntos,
    allSubcategories, // For lookup
    allAssuntos, // For lookup
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
  };
};
