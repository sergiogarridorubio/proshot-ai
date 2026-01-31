import React, { useState, useRef } from 'react';
import { generateProfessionalImage, editImage } from './services/geminiService';
import { GeneratedImage } from './types';
import LoadingOverlay from './components/LoadingOverlay';
import EditModal from './components/EditModal';

const App: React.FC = () => {
  const [productName, setProductName] = useState('');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateVariations = async () => {
    if (!originalImage || !productName) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      const styles: Array<'studio' | 'lifestyle' | 'usage'> = ['studio', 'lifestyle', 'usage'];
      const labels = ['Estudio Flash', 'Lifestyle', 'Comercial'];
      
      const results = await Promise.all(styles.map(async (style, index) => {
        const url = await generateProfessionalImage(productName, originalImage, style);
        return {
          id: `gen-${style}-${Date.now()}`,
          url,
          type: style,
          label: labels[index]
        };
      }));

      setGeneratedImages(results);
    } catch (err: any) {
      console.error(err);
      setError('Error al generar las imágenes. Verifica tu API Key en Vercel o espera unos minutos si has superado el límite gratuito.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenEdit = (id: string) => {
    setSelectedImageId(id);
    setIsEditing(true);
  };

  const handleApplyEdit = async (prompt: string) => {
    const targetImage = generatedImages.find(img => img.id === selectedImageId);
    if (!targetImage) return;

    setIsGenerating(true);
    setIsEditing(false);
    try {
      const newUrl = await editImage(targetImage.url, prompt, productName);
      setGeneratedImages(prev => prev.map(img => 
        img.id === selectedImageId ? { ...img, url: newUrl } : img
      ));
    } catch (err) {
      setError('Error al aplicar el retoque. Inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 pb-20 selection:bg-indigo-500 selection:text-white">
      {/* Header Simplificado */}
      <header className="sticky top-0 z-40 bg-slate-900/60 backdrop-blur-2xl border-b border-white/5 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-tr from-indigo-600 to-cyan-500 p-2.5 rounded-2xl shadow-xl shadow-indigo-500/20 rotate-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tighter">ProShot<span className="text-cyan-400">Flash</span></h1>
        </div>
        
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[10px] font-black bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/20">GEMINI 2.5 FLASH</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 mt-16">
        {error && (
          <div className="mb-10 bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-3xl text-center">
            <p className="font-bold">{error}</p>
          </div>
        )}

        {!originalImage ? (
          <div className="max-w-2xl mx-auto text-center space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="space-y-6">
              <h2 className="text-7xl font-black tracking-tight leading-[0.9] text-white">Fotos de producto <br/><span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">al instante.</span></h2>
              <p className="text-slate-400 text-xl font-medium max-w-lg mx-auto leading-relaxed">Usa el poder de Gemini Flash para crear contenido comercial sin necesidad de una cuenta de pago.</p>
            </div>
            
            <div className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 shadow-3xl space-y-8">
              <input
                type="text"
                placeholder="Nombre del producto..."
                className="w-full bg-slate-950/50 border border-white/10 rounded-2xl p-6 text-center outline-none focus:border-cyan-500 transition-all text-xl font-bold"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white text-black py-6 rounded-2xl font-black text-xl hover:bg-cyan-50 hover:-translate-y-1 transition-all shadow-2xl"
              >
                SUBIR Y GENERAR
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
          </div>
        ) : (
          <div className="space-y-16 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row items-center justify-between bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5 gap-8 shadow-2xl">
              <div className="flex items-center gap-8">
                <img src={originalImage} className="w-24 h-24 rounded-[1.5rem] object-cover ring-4 ring-cyan-500/30" />
                <h3 className="text-3xl font-black text-white">{productName}</h3>
              </div>
              
              <button 
                onClick={generateVariations}
                disabled={isGenerating || !productName}
                className="w-full md:w-auto bg-indigo-600 px-12 py-5 rounded-2xl font-black hover:bg-indigo-500 transition-all disabled:opacity-50 text-lg shadow-xl shadow-indigo-600/20"
              >
                {isGenerating ? 'PROCESANDO...' : 'GENERAR SET'}
              </button>
            </div>

            {generatedImages.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {generatedImages.map((img) => (
                  <div key={img.id} className="group relative bg-slate-900/30 rounded-[3rem] overflow-hidden border border-white/5 hover:border-cyan-500/40 transition-all duration-700">
                    <div className="aspect-square relative overflow-hidden">
                      <img src={img.url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-4 p-8 backdrop-blur-sm">
                        <button onClick={() => handleOpenEdit(img.id)} className="w-full bg-white text-black py-4 rounded-2xl font-black">RETOCAR</button>
                        <a href={img.url} download={`${productName}.png`} className="w-full bg-cyan-600/20 text-cyan-100 py-4 rounded-2xl font-black border border-cyan-500/30 text-center">DESCARGAR</a>
                      </div>
                    </div>
                    <div className="p-8 flex justify-between items-center">
                      <div>
                        <span className="block text-[10px] font-black uppercase text-cyan-500 tracking-widest">Flash Render</span>
                        <span className="text-xl font-black text-white">{img.label}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {isGenerating && <LoadingOverlay message="Generando con Gemini Flash..." />}
      <EditModal isOpen={isEditing} onClose={() => setIsEditing(false)} onConfirm={handleApplyEdit} isLoading={isGenerating} />
      
      <footer className="mt-32 py-12 border-t border-white/5 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.5em]">
        Gemini 2.5 Flash Edition
      </footer>
    </div>
  );
};

export default App;
