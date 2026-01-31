import { GoogleGenAI } from "@google/genai";

// Modelo optimizado para velocidad y disponibilidad gratuita
const MODEL_NAME = 'gemini-2.5-flash-image';

/**
 * Genera una imagen profesional usando Gemini 2.5 Flash.
 */
export const generateProfessionalImage = async (
  productName: string,
  base64Image: string,
  style: 'studio' | 'lifestyle' | 'usage'
): Promise<string> => {
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
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    // Buscamos la parte que contiene la imagen
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part?.inlineData?.data) {
      throw new Error("No se recibió imagen de la IA");
    }

    return `data:image/png;base64,${part.inlineData.data}`;
  } catch (error: any) {
    console.error("Error en Gemini Service:", error);
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
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part?.inlineData?.data) throw new Error("Error en edición");

    return `data:image/png;base64,${part.inlineData.data}`;
  } catch (error: any) {
    throw error;
  }
};
