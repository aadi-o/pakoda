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
        maxOutputTokens: 150,
        thinkingConfig: { thinkingBudget: 0 } // Fix: Reduced delay by disabling unnecessary reasoning
      },
    });

    const responseText = response.text || "";
    
    // Updated Regex to catch [EMOTION] [IQ: +/-X]
    const emotionRegex = /\[(NEUTRAL|ANNOYED|CONFIDENT|SAVAGE|ANGRY)\]/i;
    const iqRegex = /\[IQ:\s*([+-]?\d+)\]/i;

    let emotion = Emotion.NEUTRAL;
    let iqAdjustment = 0;
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

    return {
      text: cleanText,
      emotion: emotion,
      iqAdjustment: iqAdjustment
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
    // SPEED OPTIMIZED PROMPT: Rapid-fire delivery with zero pauses to fix the delay.
    const prompt = `Speak this extremely fast with zero pauses, rapid-fire street-smart attitude. Speed: 1.25x. Tone: Aggressive but composed. Text: ${text}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        thinkingConfig: { thinkingBudget: 0 }, // Fix: Faster speech start
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