
export interface GeneratedImage {
  id: string;
  url: string;
  type: 'studio' | 'lifestyle' | 'usage';
  label: string;
}

export interface AppState {
  productName: string;
  originalImage: string | null;
  generatedImages: GeneratedImage[];
  isGenerating: boolean;
  error: string | null;
}
