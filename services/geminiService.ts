
import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Emotion, GeminiResponse, RoastIntensity } from "../types";

const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const sendMessageToGemini = async (
  message: string,
  history: { role: string; parts: { text: string }[] }[],
  intensity: RoastIntensity = 'savage'
): Promise<GeminiResponse> => {
  try {
    const ai = getAI();
    const intensityPrompt = `[INTENSITY: ${intensity.toUpperCase()}] User says: ${message}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history.map(h => ({ role: h.role, parts: h.parts })), { role: 'user', parts: [{ text: intensityPrompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 1.0, 
        topP: 0.95,
        maxOutputTokens: 100,
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    const responseText = response.text || "";
    const tagRegex = /^\[(NEUTRAL|ANNOYED|CONFIDENT|SAVAGE|ANGRY)\]\s*/i;
    const match = responseText.match(tagRegex);

    let emotion = Emotion.NEUTRAL;
    let cleanText = responseText;

    if (match) {
      const tag = match[1].toUpperCase();
      if (tag in Emotion) {
        emotion = tag as Emotion;
      }
      cleanText = responseText.replace(tagRegex, '').trim();
    }

    return {
      text: cleanText,
      emotion: emotion,
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "System crash ho gaya tera logic dekh ke. Refresh kar aur nikal yahan se.",
      emotion: Emotion.ANGRY,
    };
  }
};

export const generateSpeech = async (text: string, emotion: Emotion): Promise<string | undefined> => {
  try {
    const ai = getAI();
    const prompt = `Speak this with pure street-smart attitude. Speed: Fast. Tone: Aggressive but composed. Text: ${text}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    return undefined;
  }
};
