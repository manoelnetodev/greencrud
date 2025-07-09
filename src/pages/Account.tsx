import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { User, Mail, Save, LogOut } from 'lucide-react';

interface AccountProps {
  session: Session;
}

const Account: React.FC<AccountProps> = ({ session }) => {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [website, setWebsite] = useState<string | null>(null);
  const [avatar_url, setAvatarUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let ignore = false;
    async function getProfile() {
      setLoading(true);
      const { user } = session;

      const { data, error } = await supabase
        .from('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', user.id)
        .single();

      if (!ignore) {
        if (error) {
          console.warn(error);
          setMessage({ type: 'error', text: 'Erro ao carregar perfil.' });
        } else if (data) {
          setUsername(data.username);
          setWebsite(data.website);
          setAvatarUrl(data.avatar_url);
        }
      }

      setLoading(false);
    }

    getProfile();

    return () => {
      ignore = true;
    };
  }, [session]);

  async function updateProfile(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const { user } = session;

    const updates = {
      id: user.id,
      username,
      website,
      avatar_url,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Erro ao atualizar perfil.' });
    } else {
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] p-4">
      <div className="bg-surface rounded-xl shadow-2xl p-8 w-full max-w-md border border-border animate-fade-in-up">
        <h1 className="text-4xl font-extrabold text-center text-text mb-8 leading-tight">
          Minha Conta
        </h1>

        {message && (
          <div
            className={`p-4 mb-6 rounded-lg text-center text-sm font-medium ${
              message.type === 'success' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
            }`}
            role="alert"
          >
            {message.text}
          </div>
        )}

        <form onSubmit={updateProfile} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-textSecondary text-sm font-medium mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" size={20} />
              <input
                id="email"
                type="text"
                value={session.user.email}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-text placeholder-textSecondary cursor-not-allowed"
                disabled
              />
            </div>
          </div>

          <div>
            <label htmlFor="username" className="block text-textSecondary text-sm font-medium mb-2">
              Nome de Usuário
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" size={20} />
              <input
                id="username"
                type="text"
                value={username || ''}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-text placeholder-textSecondary focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ease-in-out"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="website" className="block text-textSecondary text-sm font-medium mb-2">
              Website
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07L9.5 3.5"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07L14.5 20.5"></path>
              </svg>
              <input
                id="website"
                type="url"
                value={website || ''}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-text placeholder-textSecondary focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ease-in-out"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-all duration-300 ease-in-out flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
              <>
                <Save size={20} /> Salvar Perfil
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          className="w-full mt-4 bg-error text-white py-3 rounded-lg font-semibold text-lg hover:bg-error/90 transition-all duration-300 ease-in-out flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          onClick={() => supabase.auth.signOut()}
          disabled={loading}
        >
          <LogOut size={20} /> Sair
        </button>
      </div>
    </div>
  );
};

export default Account;
