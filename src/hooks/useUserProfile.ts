import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface UserProfile {
  name: string | null;
  avatar_url: string | null;
  email: string | null;
  // Adicione outros campos do perfil se precisar exibi-los no futuro
}

export const useUserProfile = () => {
  const { user: authUser, loading: authLoading } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (authLoading) return; // Espera a sessão de autenticação carregar

      if (!authUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('user_profile')
        .select('name, avatar_url, email')
        .eq('user_id', authUser.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        setError(error.message);
        setProfile(null);
      } else if (data) {
        setProfile(data);
      } else {
        // Se nenhum perfil for encontrado (ex: novo usuário antes do trigger), usa dados do auth.user
        setProfile({ name: authUser.email?.split('@')[0] || 'Usuário', avatar_url: null, email: authUser.email });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [authUser, authLoading]);

  return { profile, loading, error };
};
