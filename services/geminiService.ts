import { GoogleGenAI, Modality } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Emotion, GeminiResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const sendMessageToGemini = async (
  message: string,
  history: { role: string; parts: { text: string }[] }[]
): Promise<GeminiResponse> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: history,
    });

    // Simple timeout wrap for better UX
    const responsePromise = chat.sendMessage({ message });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000));
    
    const result: any = await Promise.race([responsePromise, timeoutPromise]);
    const responseText = result.text || "";

    // Parse Emotion Tag
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
      text: "Abey, server slow hai ya tera internet tatti? Wait kar thoda.",
      emotion: Emotion.ANNOYED,
    };
  }
};

export const generateSpeech = async (text: string, emotion: Emotion): Promise<string | undefined> => {
  try {
    const prompt = `Speak this in a ${emotion.toLowerCase()}, sharp, confident, and slightly mocking human tone: ${text}`;
    
    const responsePromise = ai.models.generateContent({
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

    // Timeout TTS after 10s so we don't hold up the UI forever
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("TTS Timeout")), 10000));
    const response: any = await Promise.race([responsePromise, timeoutPromise]);

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Generation Error:", error);
    return undefined;
  }
};