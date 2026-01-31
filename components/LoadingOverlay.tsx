
import React from 'react';

const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md p-6">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
      <h2 className="text-2xl font-semibold text-white mb-2 text-center">{message}</h2>
      <p className="text-slate-400 animate-pulse text-center max-w-xs px-4">
        Nuestra IA está diseñando la iluminación y el fondo perfecto para tu producto...
      </p>
    </div>
  );
};

export default LoadingOverlay;
