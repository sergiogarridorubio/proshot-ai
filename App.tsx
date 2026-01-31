
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
        const url = await generateProfessionalImage(productName, originalImage, style);
        return {
          id: `gen-${style}-${Date.now()}`,
          url,
          type: style,
          label: labels[index]
        };
      });

      const results = await Promise.all(promises);
      setGeneratedImages(results);
    } catch (err) {
      console.error(err);
      setError('Error de conexión o API Key inválida. Revisa la configuración en Vercel.');
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
    <div className="min-h-screen bg-[#0f172a] text-white pb-20">
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">ProShot AI</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={handleShareApp} className="p-2 bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          {originalImage && (
            <button onClick={resetApp} className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Reiniciar</button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-10">
        {!originalImage ? (
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Fotos de Producto Pro</h2>
            <p className="text-slate-400 mb-10">Sube una foto y deja que la IA haga el resto.</p>
            
            <div className="bg-slate-800/40 border-2 border-dashed border-slate-700 rounded-3xl p-10">
              <input
                type="text"
                placeholder="Nombre del producto..."
                className="w-full mb-6 bg-slate-900 border border-slate-700 rounded-2xl p-4 text-center text-lg outline-none focus:ring-2 focus:ring-indigo-500"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={!productName.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-600/20 transition-all"
              >
                Subir Foto
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={originalImage} className="w-12 h-12 rounded-lg object-cover" />
                <span className="font-bold">{productName}</span>
              </div>
              {generatedImages.length === 0 && (
                <button onClick={generateVariations} disabled={isGenerating} className="bg-indigo-600 px-6 py-2 rounded-xl font-bold">Generar</button>
              )}
            </div>

            {error && <div className="text-red-400 text-center p-4 bg-red-400/10 rounded-xl border border-red-400/20">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {generatedImages.map((img) => (
                <div key={img.id} className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700/50">
                  <div className="aspect-[4/5] relative group">
                    <img src={img.url} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => handleOpenEdit(img.id)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold"
                    >
                      Editar con IA
                    </button>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">{img.label}</span>
                    <button onClick={() => handleSaveImage(img)} className="text-indigo-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {isGenerating && <LoadingOverlay message={isEditing ? "Editando..." : "Creando fotos..."} />}
      <EditModal isOpen={isEditing} onClose={() => setIsEditing(false)} onConfirm={handleApplyEdit} isLoading={isGenerating} />
    </div>
  );
};

export default App;
