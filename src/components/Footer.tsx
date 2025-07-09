import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-surface text-textSecondary py-6 px-4 border-t border-border shadow-inner">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-sm">
        <p className="text-center md:text-left mb-2 md:mb-0">
          &copy; {new Date().getFullYear()} Bolt. Todos os direitos reservados.
        </p>
        <nav className="flex space-x-4">
          <a href="#" className="hover:text-primary transition-colors duration-200">
            Privacidade
          </a>
          <a href="#" className="hover:text-primary transition-colors duration-200">
            Termos
          </a>
          <a href="#" className="hover:text-primary transition-colors duration-200">
            Suporte
          </a>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
