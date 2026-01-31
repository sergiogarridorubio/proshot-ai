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
      if (file.size > 4 * 1024 * 1024) {
        setError('La imagen es demasiado grande. Intenta con una de menos de 4MB.');
        return;
      }
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
    setGeneratedImages([]);

    try {
      const styles: Array<'studio' | 'lifestyle' | 'usage'> = ['studio', 'lifestyle', 'usage'];
      const labels = ['Foto de Estudio', 'Estilo de Vida', 'Producto en Uso'];
      
      const promises = styles.map(async (style, index) => {
        try {
          const url = await generateProfessionalImage(productName, originalImage, style);
          return {
            id: `gen-${style}-${Date.now()}`,
            url,
            type: style,
            label: labels[index]
          };
        } catch (e) {
          console.error(`Error generating ${style}:`, e);
          throw e;
        }
      });

      const results = await Promise.all(promises);
      setGeneratedImages(results);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('quota')) {
        setError('Límite de la API alcanzado. Espera un minuto y vuelve a intentarlo.');
      } else {
        setError('Hubo un problema al generar las imágenes. Verifica tu conexión y API Key.');
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
    setError(null);

    try {
      const newUrl = await editImage(targetImage.url, prompt, productName);
      setGeneratedImages(prev => prev.map(img => 
        img.id === selectedImageId ? { ...img, url: newUrl } : img
      ));
    } catch (err) {
      console.error(err);
      setError('Error al editar. Inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
      setSelectedImageId(null);
    }
  };

  const resetApp = () => {
    setProductName('');
    setOriginalImage(null);
    setGeneratedImages([]);
    setError(null);
  };

  const handleShareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ProShot AI',
          text: '¡Mira esta app para crear fotos profesionales de producto!',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error compartiendo:', err);
      }
    }
  };

  const handleSaveImage = async (img: GeneratedImage) => {
    const fileName = `${productName.replace(/\s+/g, '_')}_${img.type}.png`;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
      try {
        const response = await fetch(img.url);
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: productName,
          });
          return;
        }
      } catch (err) {
        console.error('Error al guardar:', err);
      }
    }

    const link = document.createElement('a');
    link.href = img.url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white pb-20 selection:bg-indigo-500/30">
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent uppercase">
            PROSHOT<span className="text-indigo-500">AI</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={handleShareApp} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          {originalImage && (
            <button 
              onClick={resetApp} 
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors"
            >
              Nuevo Proyecto
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-12">
        {!originalImage ? (
          <div className="max-w-2xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Fotos de Producto <br/> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Nivel Profesional</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-md mx-auto">
                Transforma cualquier foto casera en una toma publicitaria de alta gama en segundos.
              </p>
            </div>
            
            <div className="bg-slate-800/30 border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-sm">
              <div className="space-y-6">
                <div className="group relative">
                  <input
                    type="text"
                    placeholder="¿Qué producto es? (Ej: Reloj de lujo)"
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-5 text-center text-lg outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!productName.trim()}
                  className="w-full group relative overflow-hidden bg-white text-slate-950 disabled:opacity-30 py-5 rounded-2xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Subir Foto Original
                  </span>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              </div>
              
              <p className="mt-8 text-xs text-slate-500 uppercase tracking-widest font-medium">
                Sugerencia: Usa buena luz y fondo neutro para mejores resultados
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="bg-slate-800/40 p-5 rounded-3xl border border-white/5 flex items-center justify-between backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <img src={originalImage} className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/10 group-hover:ring-indigo-500/50 transition-all" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-none mb-1">{productName}</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-tighter">Imagen original cargada</p>
                </div>
              </div>
              {generatedImages.length === 0 && (
                <button 
                  onClick={generateVariations} 
                  disabled={isGenerating} 
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20"
                >
                  Generar Set de Fotos
                </button>
              )}
            </div>

            {error && (
              <div className="text-red-400 text-sm font-medium text-center p-4 bg-red-400/5 rounded-2xl border border-red-400/20 animate-pulse">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {generatedImages.length > 0 ? (
                generatedImages.map((img, idx) => (
                  <div 
                    key={img.id} 
                    className="group bg-slate-800/50 rounded-[2rem] overflow-hidden border border-white/5 hover:border-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-500/5 animate-in zoom-in-95 duration-500"
                    style={{ animationDelay: `${idx * 150}ms` }}
                  >
                    <div className="aspect-[4/5] relative overflow-hidden bg-slate-900">
                      <img src={img.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                        <button 
                          onClick={() => handleOpenEdit(img.id)}
                          className="w-full bg-white/10 backdrop-blur-md hover:bg-white/20 text-white py-3 rounded-xl font-bold transition-all border border-white/10"
                        >
                          Retocar con IA
                        </button>
                      </div>
                    </div>
                    <div className="p-6 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-indigo-400 uppercase tracking-[0.2em] font-black block mb-1">Preset</span>
                        <span className="font-bold text-slate-200">{img.label}</span>
                      </div>
                      <button 
                        onClick={() => handleSaveImage(img)} 
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-indigo-400 hover:text-indigo-300 transition-all active:scale-90"
                        title="Descargar imagen"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : !isGenerating && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                  <p className="text-slate-500 font-medium">Pulsa el botón superior para empezar la magia ✨</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {isGenerating && <LoadingOverlay message={isEditing ? "Perfeccionando retoque..." : "Diseñando escenas..."} />}
      <EditModal isOpen={isEditing} onClose={() => setIsEditing(false)} onConfirm={handleApplyEdit} isLoading={isGenerating} />
    </div>
  );
};

export default App;
