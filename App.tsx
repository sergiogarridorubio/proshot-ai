import React, { useState, useRef, useEffect } from 'react';
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
  const [showKeyButton, setShowKeyButton] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comprobar si ya hay una key seleccionada al cargar
  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const hasKey = await aistudio.hasSelectedApiKey();
        setShowKeyButton(!hasKey);
      } else {
        // Si no estamos en el entorno de AI Studio, dependemos de process.env
        setShowKeyButton(false);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
      setShowKeyButton(false);
      setError(null);
    }
  };

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
      const labels = ['Estudio', 'Lifestyle', 'Comercial'];
      
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
      console.error("Catch in App:", err);
      if (err.message === 'MODEL_NOT_FOUND') {
        setError('Error 404: El modelo no está disponible para esta API Key. Por favor, selecciona una API Key válida pulsando el botón de arriba.');
        setShowKeyButton(true);
      } else {
        setError('Error de conexión. Asegúrate de tener una API Key configurada correctamente.');
      }
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
    } catch (err: any) {
      if (err.message === 'MODEL_NOT_FOUND') {
        setError('Error 404: Modelo no encontrado. Intenta seleccionar la Key de nuevo.');
        setShowKeyButton(true);
      } else {
        setError('Error al aplicar el retoque.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 pb-20 selection:bg-cyan-500">
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-white/5 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500 p-2 rounded-lg shadow-lg shadow-cyan-500/20">
            <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase">ProShot <span className="text-cyan-400">Flash</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          {showKeyButton && (
            <button 
              onClick={handleSelectKey}
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 text-[10px] font-black px-4 py-2 rounded-full transition-all animate-pulse"
            >
              VINCULAR API KEY
            </button>
          )}
          <span className="hidden sm:block text-[9px] font-bold text-slate-500 tracking-[0.2em] uppercase">Status: Online</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 mt-12">
        {error && (
          <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center animate-in slide-in-from-top-4 duration-300">
            <p className="text-red-400 font-bold text-sm mb-4">{error}</p>
            {showKeyButton && (
              <button onClick={handleSelectKey} className="bg-red-500 text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-400 transition-colors">
                Solucionar ahora
              </button>
            )}
          </div>
        )}

        {!originalImage ? (
          <div className="max-w-xl mx-auto text-center space-y-10 mt-20">
            <div className="space-y-4">
              <h2 className="text-5xl font-black tracking-tight leading-tight">Fotografía de producto <span className="text-cyan-400">inteligente.</span></h2>
              <p className="text-slate-400 font-medium italic">Sube tu producto, nosotros ponemos el estudio.</p>
            </div>
            
            <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-6">
              <input
                type="text"
                placeholder="Nombre del producto (ej: Perfume de Lujo)"
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-center outline-none focus:border-cyan-500 transition-all font-bold"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white text-slate-900 py-5 rounded-xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
              >
                EMPEZAR AHORA
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row items-center justify-between bg-slate-900/40 p-6 rounded-3xl border border-white/5 gap-6">
              <div className="flex items-center gap-6">
                <img src={originalImage} className="w-20 h-20 rounded-2xl object-cover border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/10" />
                <div>
                  <h3 className="text-2xl font-black">{productName}</h3>
                  <button onClick={() => setOriginalImage(null)} className="text-[10px] font-bold text-slate-500 hover:text-red-400 transition-colors uppercase tracking-widest">Cambiar imagen</button>
                </div>
              </div>
              
              <button 
                onClick={generateVariations}
                disabled={isGenerating || !productName}
                className="w-full md:w-auto bg-cyan-600 px-10 py-4 rounded-xl font-black hover:bg-cyan-500 transition-all disabled:opacity-30 shadow-lg shadow-cyan-600/20"
              >
                {isGenerating ? 'GENERANDO RENDER...' : 'GENERAR ESTUDIO COMPLETO'}
              </button>
            </div>

            {generatedImages.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {generatedImages.map((img) => (
                  <div key={img.id} className="group relative bg-slate-900/30 rounded-[2rem] overflow-hidden border border-white/5 hover:border-cyan-500/30 transition-all">
                    <div className="aspect-square relative">
                      <img src={img.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-6 backdrop-blur-sm">
                        <button onClick={() => handleOpenEdit(img.id)} className="w-full bg-white text-slate-900 py-3 rounded-xl font-black text-sm uppercase">Personalizar</button>
                        <a href={img.url} download={`${productName}.png`} className="w-full border border-white/20 text-white py-3 rounded-xl font-black text-sm text-center uppercase">Guardar</a>
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-xs font-black text-cyan-500 uppercase tracking-widest mb-1">Flash Mode</p>
                      <h4 className="text-lg font-bold">{img.label}</h4>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {isGenerating && <LoadingOverlay message="La IA está procesando tu producto..." />}
      <EditModal isOpen={isEditing} onClose={() => setIsEditing(false)} onConfirm={handleApplyEdit} isLoading={isGenerating} />
    </div>
  );
};

export default App;
