import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  expectedText: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  expectedText,
}) => {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputText(''); // Limpa o input ao abrir o modal
      // Foca o campo de input quando o modal abre
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100); // Pequeno atraso para garantir que o modal seja renderizado
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmButtonEnabled = inputText === expectedText;

  const handleConfirm = () => {
    if (isConfirmButtonEnabled) {
      onConfirm();
      // O modal será fechado pela função que chamou onConfirm,
      // ou pode ser fechado aqui se preferir que o modal gerencie seu próprio fechamento.
      // Por simplicidade, vamos deixar a função pai gerenciar o fechamento após a ação.
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isConfirmButtonEnabled) {
      handleConfirm();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-surface rounded-xl shadow-2xl p-6 w-full max-w-md transform scale-95 opacity-0 animate-scale-in-up">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-text">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-textSecondary hover:bg-border hover:text-text transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-textSecondary mb-6">{message}</p>
        <div className="mb-6">
          <label htmlFor="confirm-input" className="block text-sm font-medium text-text mb-2">
            Digite "<span className="font-semibold text-error">{expectedText}</span>" para confirmar:
          </label>
          <input
            id="confirm-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            ref={inputRef}
            className="w-full px-4 py-2 rounded-lg bg-background border border-border text-text placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-error focus:border-transparent transition-colors"
            placeholder={expectedText}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-textSecondary border border-border hover:bg-border transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmButtonEnabled}
            className={`px-5 py-2 rounded-lg font-semibold transition-colors ${
              isConfirmButtonEnabled
                ? 'bg-error text-white hover:bg-error/90'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            Confirmar Desabilitação
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
