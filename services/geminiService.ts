
import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Emotion, GeminiResponse, RoastIntensity, Interjection } from "../types";

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
        maxOutputTokens: 250,
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    const responseText = response.text || "";
    
    const emotionRegex = /\[(NEUTRAL|ANNOYED|CONFIDENT|SAVAGE|ANGRY)\]/i;
    const iqRegex = /\[IQ:\s*([+-]?\d+)\]/i;
    const sidekickRegex = /\[SIDEKICK:\s*(MASALA|BUN|CUTTING|KAJU)\s*\|\s*([^\]]+)\]/i;

    let emotion = Emotion.NEUTRAL;
    let iqAdjustment = 0;
    let interjection: Interjection | undefined = undefined;
    let cleanText = responseText;

    const emotionMatch = responseText.match(emotionRegex);
    if (emotionMatch) {
      const tag = emotionMatch[1].toUpperCase();
      if (tag in Emotion) emotion = tag as Emotion;
      cleanText = cleanText.replace(emotionRegex, '').trim();
    }

    const iqMatch = responseText.match(iqRegex);
    if (iqMatch) {
      iqAdjustment = parseInt(iqMatch[1]);
      cleanText = cleanText.replace(iqRegex, '').trim();
    }

    const sidekickMatch = responseText.match(sidekickRegex);
    if (sidekickMatch) {
      interjection = {
        character: sidekickMatch[1].toLowerCase() as any,
        content: sidekickMatch[2].trim()
      };
      cleanText = cleanText.replace(sidekickRegex, '').trim();
    }

    // Final cleanup of any remaining bracket artifacts
    cleanText = cleanText.replace(/\[[^\]]*\]/g, '').trim();

    return {
      text: cleanText,
      emotion: emotion,
      iqAdjustment: iqAdjustment,
      interjection: interjection
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "System crash ho gaya tera logic dekh ke. Refresh kar aur nikal yahan se.",
      emotion: Emotion.ANGRY,
      iqAdjustment: -50
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
