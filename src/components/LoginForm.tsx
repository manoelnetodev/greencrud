import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, UserPlus, LogIn } from 'lucide-react';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let authResponse;
      if (isSignUp) {
        authResponse = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              // You can add initial user profile data here if needed
              // For example, a default name or avatar_url
            },
            emailRedirectTo: `${window.location.origin}/`, // Redirect back to app after email confirmation (if enabled)
            // disableEmailConfirmation: true, // Keep this true as per instructions
          },
        });
      } else {
        authResponse = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }

      const { data, error: authError } = authResponse;

      if (authError) {
        setError(authError.message);
      } else if (data.user) {
        setUser(data.user);
        // If it's a signup, you might want to show a message about email confirmation
        // or redirect to a different page if email confirmation is enabled.
      } else {
        // This case might happen if signup requires email confirmation and no user is returned immediately
        setError('Verifique seu e-mail para confirmar sua conta.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-surface rounded-lg shadow-xl border border-border animate-fade-in">
      <h2 className="text-3xl font-bold text-center text-text mb-6">
        {isSignUp ? 'Criar Conta' : 'Bem-vindo de volta!'}
      </h2>

      {error && (
        <div className="bg-error/20 border border-error text-error p-3 rounded-lg mb-4 text-sm" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="sr-only">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textSecondary" />
            <input
              id="email"
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 pl-10 rounded-lg bg-background border border-border text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="sr-only">Senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textSecondary" />
            <input
              id="password"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 pl-10 rounded-lg bg-background border border-border text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white p-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {loading ? (
            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
          ) : isSignUp ? (
            <>
              <UserPlus className="w-5 h-5" /> Cadastrar
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" /> Entrar
            </>
          )}
        </button>
      </form>

      <p className="text-center text-textSecondary text-sm mt-6">
        {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-primary hover:underline ml-1 font-medium transition-colors"
        >
          {isSignUp ? 'Entrar' : 'Cadastre-se'}
        </button>
      </p>
    </div>
  );
};

export default LoginForm;
