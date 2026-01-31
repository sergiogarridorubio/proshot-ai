import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-2.5-flash-image';

export const generateProfessionalImage = async (
  productName: string,
  base64Image: string,
  style: 'studio' | 'lifestyle' | 'usage'
): Promise<string> => {
  // Siempre crear la instancia justo antes de usarla
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let prompt = "";
  if (style === 'studio') {
    prompt = `Professional studio photography of this ${productName}. 
    Soft professional lighting, clean minimal background, commercial photography style, high quality.`;
  } else if (style === 'lifestyle') {
    prompt = `Lifestyle photography of this ${productName} in a realistic home or office setting. 
    Natural lighting, cozy atmosphere, high resolution.`;
  } else {
    prompt = `Action/Contextual shot of ${productName}. 
    Realistic environment, professional depth of field, sharp details.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: 'image/png',
            },
          },
          { text: prompt },
        ],
      },
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part?.inlineData?.data) {
      throw new Error("EMPTY_RESPONSE");
    }

    return `data:image/png;base64,${part.inlineData.data}`;
  } catch (error: any) {
    console.error("Detailed Error:", error);
    // Si es 404, es un problema de permisos del modelo con esa Key
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      throw new Error("MODEL_NOT_FOUND");
    }
    throw error;
  }
};

export const editImage = async (
  base64Image: string,
  editPrompt: string,
  productName: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: 'image/png',
            },
          },
          { text: `Edit this photo of ${productName}: ${editPrompt}. Keep it professional.` },
        ],
      },
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part?.inlineData?.data) throw new Error("No data in response");

    return `data:image/png;base64,${part.inlineData.data}`;
  } catch (error: any) {
    if (error.message?.includes('404')) throw new Error("MODEL_NOT_FOUND");
    throw error;
  }
};
