import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Sun, Moon, LogOut, ChevronDown, ArrowUpRight } from 'lucide-react'; // Adicionado ArrowUpRight
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuthStore } from '../store/authStore';

const Header: React.FC = () => {
  const { profile, loading: profileLoading } = useUserProfile();
  const { logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Extrai os segmentos da URL para os breadcrumbs
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Função para obter as iniciais do nome para o avatar padrão
  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Estado e função para o toggle de tema (apenas visual por enquanto)
  const [isDarkMode, setIsDarkMode] = useState(true); // Assumindo dark mode como padrão
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // Em uma aplicação real, você atualizaria um estado de tema global ou adicionaria/removeria uma classe do <html>
  };

  return (
    <header className="bg-surface border-b border-border py-4 px-4 sm:px-8 flex items-center justify-between shadow-lg">
      {/* Seção Esquerda: Logo/Marca e Breadcrumbs */}
      <div className="flex items-center gap-6">
        {/* Logo/Marca */}
        <Link to="/instituicoes" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
          <div className="relative w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md">
            <ArrowUpRight className="w-4 h-4 text-brand-green" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold tracking-tight hidden sm:block">GreenCard</span>
        </Link>

        {/* Breadcrumbs */}
        <nav className="hidden md:flex text-textSecondary text-sm items-center space-x-2">
          <Link to="/instituicoes" className="hover:text-primary transition-colors flex items-center">
            <Home className="w-4 h-4 inline-block mr-1" />
            Home
          </Link>
          {pathnames.map((name, index) => {
            const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
            const isLast = index === pathnames.length - 1;
            // Formatação básica do nome para exibição
            const displayName = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');

            return (
              <span key={name} className="flex items-center">
                <span className="mx-1">/</span>
                {isLast ? (
                  <span className="text-text font-medium">{displayName}</span>
                ) : (
                  <Link to={routeTo} className="hover:text-primary transition-colors">
                    {displayName}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
      </div>

      {/* Seção Direita: Toggle de Tema, Perfil do Usuário */}
      <div className="flex items-center gap-4">
        {/* Toggle de Tema */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-textSecondary hover:bg-border hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={isDarkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Dropdown do Perfil do Usuário */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 p-2 rounded-full hover:bg-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
          >
            {profileLoading ? (
              <div className="w-10 h-10 rounded-full bg-primary/20 animate-pulse"></div>
            ) : (
              <>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar do Usuário" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-lg">
                    {getInitials(profile?.name)}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-text text-sm font-medium">{profile?.name || 'Carregando...'}</p>
                  <p className="text-textSecondary text-xs">{profile?.email || ''}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-textSecondary transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-xl z-20 overflow-hidden">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-3 text-text hover:bg-background transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
