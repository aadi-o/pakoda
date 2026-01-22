import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Emotion, GeminiResponse } from "../types";

const getAI = () => {
  const key = process.env.API_KEY;
  return new GoogleGenAI({ apiKey: key || "" });
};

export const sendMessageToGemini = async (
  message: string,
  history: { role: string; parts: { text: string }[] }[]
): Promise<GeminiResponse> => {
  try {
    const ai = getAI();
    // Switched to gemini-3-flash-preview for maximum speed and lower latency
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history.map(h => ({ role: h.role, parts: h.parts })), { role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.9,
        topP: 0.95,
        // Disable thinking to ensure the fastest possible response time
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
      text: "Abey system hang ho gaya tera kachra input dekh ke. Restart kar aur dhang ka sawal pooch.",
      emotion: Emotion.ANGRY,
    };
  }
};

export const generateSpeech = async (text: string, emotion: Emotion): Promise<string | undefined> => {
  try {
    const ai = getAI();
    const prompt = `Speak this in a ${emotion.toLowerCase()}, sharp, human tone. Be extremely sarcastic and quick: ${text}`;
    
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