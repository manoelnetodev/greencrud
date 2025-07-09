import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, LogOut, ChevronDown } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuthStore } from '../store/authStore';
// import { supabase } from '../lib/supabase'; // Não é mais necessário se os breadcrumbs dinâmicos forem removidos

const Header: React.FC = () => {
  const { profile, loading: profileLoading } = useUserProfile();
  const { logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Estados para os nomes dinâmicos dos breadcrumbs (REMOVIDOS)
  // const [institutionDisplayName, setInstitutionDisplayName] = useState<string | null>(null);
  // const [provaDisplayName, setProvaDisplayName] = useState<string | null>(null);
  // const [breadcrumbsLoading, setBreadcrumbsLoading] = useState(false);

  // Extrai os segmentos da URL para os breadcrumbs (ainda pode ser útil para outras lógicas, mas não para breadcrumbs)
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Efeito para buscar os nomes da instituição e prova (REMOVIDO)
  // useEffect(() => {
  //   const fetchDisplayNames = async () => {
  //     setBreadcrumbsLoading(true);
  //     setInstitutionDisplayName(null);
  //     setProvaDisplayName(null);

  //     let currentInstitutionId: string | null = null;
  //     let currentProvaId: string | null = null;

  //     for (let i = 0; i < pathnames.length; i++) {
  //       if (pathnames[i] === 'instituicoes' && pathnames[i + 1]) {
  //         currentInstitutionId = pathnames[i + 1];
  //       }
  //       if (pathnames[i] === 'provas' && pathnames[i + 1]) {
  //         currentProvaId = pathnames[i + 1];
  //       }
  //     }

  //     const fetches: Promise<any>[] = [];

  //     if (currentInstitutionId && !isNaN(Number(currentInstitutionId))) {
  //       fetches.push(
  //         supabase
  //           .from('instituicoes')
  //           .select('nome')
  //           .eq('id', parseInt(currentInstitutionId))
  //           .single()
  //           .then(({ data, error }) => {
  //             if (error) console.error('Error fetching institution name:', error);
  //             setInstitutionDisplayName(data?.nome || null);
  //           })
  //       );
  //     }

  //     if (currentProvaId && !isNaN(Number(currentProvaId))) {
  //       fetches.push(
  //         supabase
  //           .from('provas')
  //           .select('nome')
  //           .eq('id', parseInt(currentProvaId))
  //           .single()
  //           .then(({ data, error }) => {
  //             if (error) console.error('Error fetching prova name:', error);
  //             setProvaDisplayName(data?.nome || null);
  //           })
  //       );
  //     }

  //     await Promise.all(fetches);
  //     setBreadcrumbsLoading(false);
  //   };

  //   fetchDisplayNames();
  // }, [location.pathname, pathnames]);

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

  return (
    <header className="bg-surface border-b border-border py-4 px-4 sm:px-8 flex items-center justify-between shadow-lg">
      {/* Seção Esquerda: Logo/Marca */}
      <div className="flex items-center gap-6">
        {/* Logo/Marca */}
        <Link to="/instituicoes" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
          <img
            src="https://cdn.weweb.io/designs/89ac3b20-999f-4cbb-a5f8-d6c72de75db6/sections/gc_icon.png?_wwcv=1747853347857"
            alt="GreenCard Logo"
            className="w-[50px] h-[50px] object-contain"
          />
          <span className="text-2xl font-bold tracking-tight hidden sm:block">GreenCard</span>
        </Link>

        {/* Breadcrumbs (REMOVIDO) */}
        {/*
        <nav className="hidden md:flex text-textSecondary text-sm items-center space-x-2">
          <Link to="/instituicoes" className="hover:text-primary transition-colors flex items-center">
            <Home className="w-4 h-4 inline-block mr-1" />
            Home
          </Link>
          {pathnames.map((name, index) => {
            const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
            const isLast = index === pathnames.length - 1;
            let displayName = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');

            if (name === 'instituicoes') {
              displayName = 'Instituições';
            } else if (name === 'provas') {
              displayName = 'Provas';
            } else if (name === 'questoes') {
              displayName = 'Questões';
            } else if (pathnames[index - 1] === 'instituicoes' && !isNaN(Number(name))) {
              displayName = institutionDisplayName || name;
            } else if (pathnames[index - 1] === 'provas' && !isNaN(Number(name))) {
              displayName = provaDisplayName || name;
            }

            return (
              <span key={routeTo} className="flex items-center">
                <span className="mx-1">/</span>
                {isLast ? (
                  <span className="text-text font-medium">
                    {breadcrumbsLoading ? 'Carregando...' : displayName}
                  </span>
                ) : (
                  <Link to={routeTo} className="hover:text-primary transition-colors">
                    {breadcrumbsLoading ? 'Carregando...' : displayName}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
        */}
      </div>

      {/* Seção Direita: Perfil do Usuário */}
      <div className="flex items-center gap-4">
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
