
// Refined GoogleGenAI initialization to strictly follow the guidelines using process.env.API_KEY directly and using the .text property for content extraction.
import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Emotion, GeminiResponse } from "../types";

const getAI = () => {
  // Always use a named parameter and process.env.API_KEY directly.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const sendMessageToGemini = async (
  message: string,
  history: { role: string; parts: { text: string }[] }[]
): Promise<GeminiResponse> => {
  try {
    const ai = getAI();
    // Use gemini-3-flash-preview for the absolute lowest latency
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history.map(h => ({ role: h.role, parts: h.parts })), { role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 1.0, 
        topP: 0.95,
        maxOutputTokens: 100, // Capped tokens = Faster response time
        thinkingConfig: { thinkingBudget: 0 } // Bypass reasoning for instant reply
      },
    });

    // Directly access the .text property as per guidelines (it is not a method).
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
      text: "Abey nalle, mera dimaag mat kha. System crash ho gaya tera logic dekh ke. Refresh kar aur nikal yahan se.",
      emotion: Emotion.ANGRY,
    };
  }
};

export const generateSpeech = async (text: string, emotion: Emotion): Promise<string | undefined> => {
  try {
    const ai = getAI();
    // Prompt for TTS needs to be fast and human-like
    const prompt = `Speak this like a fast-talking, aggressive human. No robotic pauses. Pure attitude: ${text}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }, // Puck has a more youthful, aggressive edge
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    return undefined;
  }
};
