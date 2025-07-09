import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, UserPlus, LogIn } from 'lucide-react';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Login bem-sucedido!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao fazer login.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin, // Redireciona para a URL atual após confirmação (se ativada)
          data: {
            // Você pode adicionar dados de perfil iniciais aqui, se necessário
          }
        }
      });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Cadastro realizado com sucesso! Verifique seu e-mail para confirmar sua conta.' });
      // Opcional: Limpar campos ou redirecionar após o cadastro
      setEmail('');
      setPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao cadastrar.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] p-4">
      <div className="bg-surface rounded-xl shadow-2xl p-8 w-full max-w-md border border-border animate-fade-in-up">
        <h1 className="text-4xl font-extrabold text-center text-text mb-8 leading-tight">
          {isSignUp ? 'Criar Conta' : 'Bem-vindo de volta!'}
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

        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" size={20} />
              <input
                id="email"
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-text placeholder-textSecondary focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ease-in-out"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" size={20} />
              <input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-text placeholder-textSecondary focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ease-in-out"
                required
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
                {isSignUp ? 'Cadastrando...' : 'Entrando...'}
              </>
            ) : isSignUp ? (
              <>
                <UserPlus size={20} /> Cadastrar
              </>
            ) : (
              <>
                <LogIn size={20} /> Entrar
              </>
            )}
          </button>
        </form>

        <p className="text-center text-textSecondary mt-6 text-sm">
          {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary font-semibold hover:underline ml-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface rounded-md"
            disabled={loading}
          >
            {isSignUp ? 'Faça login' : 'Cadastre-se'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
