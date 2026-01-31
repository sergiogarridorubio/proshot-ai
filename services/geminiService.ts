
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = 'gemini-2.5-flash-image';

export const generateProfessionalImage = async (
  productName: string,
  base64Image: string,
  style: 'studio' | 'lifestyle' | 'usage'
): Promise<string> => {
  // Inicialización siguiendo estrictamente las guías de seguridad
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let prompt = "";
  if (style === 'studio') {
    prompt = `Fotografía profesional de estudio del producto: ${productName}. Iluminación de alta gama, fondo minimalista limpio, enfoque extremadamente nítido en el producto, calidad comercial, 8k.`;
  } else if (style === 'lifestyle') {
    prompt = `Fotografía de estilo de vida del producto: ${productName} en un entorno interior moderno y elegante. Iluminación natural suave, estética premium, atmósfera sofisticada.`;
  } else {
    prompt = `Primer plano profesional del producto: ${productName} siendo utilizado. Enfoque en los detalles y la interacción natural. Estilo editorial de alta gama.`;
  }

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
    throw new Error("No se recibieron datos de imagen de Gemini");
  }

  return `data:image/png;base64,${part.inlineData.data}`;
};

export const editImage = async (
  base64Image: string,
  editPrompt: string,
  productName: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const fullPrompt = `Basado en este producto (${productName}), aplica el siguiente cambio: ${editPrompt}. Mantén la calidad profesional, la iluminación y el enfoque original del producto.`;

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
        { text: fullPrompt },
      ],
    },
  });

  const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (!part?.inlineData?.data) {
    throw new Error("No se recibieron datos de imagen");
  }

  return `data:image/png;base64,${part.inlineData.data}`;
};
