
import React, { useState } from 'react';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (prompt: string) => void;
  isLoading: boolean;
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">Editar imagen con IA</h3>
        <p className="text-slate-400 mb-6 text-sm">
          Describe qué te gustaría cambiar. Por ejemplo: "Cambia el fondo por una playa al atardecer", "Añade un filtro de película retro" o "Haz la iluminación más cálida".
        </p>
        
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Escribe aquí las instrucciones de edición..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none mb-6"
          disabled={isLoading}
        />

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(prompt)}
            disabled={!prompt.trim() || isLoading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-medium transition-all shadow-lg"
          >
            {isLoading ? 'Procesando...' : 'Aplicar Edición'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
