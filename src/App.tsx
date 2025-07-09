import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Auth from './pages/Auth';
import Account from './pages/Account';
import InstitutionsList from './pages/InstitutionsList';
import ProvasList from './pages/ProvasList';
import QuestaoEditor from './pages/QuestaoEditor';
import Header from './components/Header';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-text">
        <p className="text-xl font-medium animate-pulse">Carregando sessão...</p>
      </div>
    );
  }

  // Verifica se a rota atual é a página de autenticação
  const isAuthPage = location.pathname === '/' || location.pathname === '/auth';

  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      {!isAuthPage && <Header />}
      <main className="flex-grow max-w-[1920px] min-w-full mx-auto py-8 px-4">
        <Routes>
          <Route path="/" element={session ? <Navigate to="/instituicoes" /> : <Auth />} />
          <Route path="/auth" element={<Auth />} />
          {session ? (
            <>
              <Route path="/account" element={<Account session={session} />} />
              <Route path="/instituicoes" element={<InstitutionsList />} />
              <Route path="/instituicoes/:institutionId/provas" element={<ProvasList />} />
              <Route path="/instituicoes/:institutionId/provas/:provaId/questoes" element={<QuestaoEditor />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/auth" />} />
          )}
        </Routes>
      </main>
    </div>
  );
};

export default App;
