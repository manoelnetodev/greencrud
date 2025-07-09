import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, LogIn } from 'lucide-react'; // Removido UserPlus

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [isSignUp, setIsSignUp] = useState(false); // Removido
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // let authResponse; // Removido
      // if (isSignUp) { // Removido
      //   authResponse = await supabase.auth.signUp({ // Removido
      //     email, // Removido
      //     password, // Removido
      //     options: { // Removido
      //       data: { // Removido
      //       }, // Removido
      //       emailRedirectTo: `${window.location.origin}/`, // Removido
      //     }, // Removido
      //   }); // Removido
      // } else { // Removido
        const { data, error: authError } = await supabase.auth.signInWithPassword({ // Mantido apenas signInWithPassword
          email,
          password,
        });
      // } // Removido

      // const { data, error: authError } = authResponse; // Removido, já desestruturado acima

      if (authError) {
        setError(authError.message);
      } else if (data.user) {
        setUser(data.user);
      } else {
        // Este caso pode acontecer se o signup exigir confirmação de e-mail e nenhum usuário for retornado imediatamente
        // Como o signup foi removido, esta mensagem pode ser ajustada ou removida se não for mais relevante para o login.
        setError('Ocorreu um erro inesperado durante o login.');
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
        Bem-vindo de volta! {/* Sempre "Bem-vindo de volta!" */}
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
          ) : (
            <>
              <LogIn className="w-5 h-5" /> Entrar {/* Apenas Entrar */}
            </>
          )}
        </button>
      </form>

      {/* Removido o parágrafo de "Não tem uma conta? Cadastre-se" */}
      {/* <p className="text-center text-textSecondary text-sm mt-6">
        {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-primary hover:underline ml-1 font-medium transition-colors"
        >
          {isSignUp ? 'Entrar' : 'Cadastre-se'}
        </button>
      </p> */}
    </div>
  );
};

export default LoginForm;
