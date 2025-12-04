import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  // API Key is injected via environment in this runtime
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateSmartGreeting = async (base64Image: string, staffName: string, type: 'CLOCK_IN' | 'CLOCK_OUT'): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Clean base64 string if it has the data URL prefix
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");

    const prompt = type === 'CLOCK_IN' 
      ? `The user ${staffName} is clocking in for work. Analyze their facial expression in the image and generate a short, warm, professional, and energetic 1-sentence welcome message. If they look happy, mention it. If they look tired, be encouraging.`
      : `The user ${staffName} is clocking out. Generate a warm 1-sentence goodbye message thanking them for their hard work based on the image.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Using Flash for low latency
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: prompt
          }
        ]
      }
    });

    return response.text || `Welcome back, ${staffName}!`;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return type === 'CLOCK_IN' ? `Welcome, ${staffName}. Have a great day!` : `Goodbye, ${staffName}. See you next time!`;
  }
};