
export enum Emotion {
  NEUTRAL = 'NEUTRAL',
  ANNOYED = 'ANNOYED',
  CONFIDENT = 'CONFIDENT',
  SAVAGE = 'SAVAGE',
  ANGRY = 'ANGRY'
}

export type RoastIntensity = 'light' | 'savage' | 'legendary';

export const INTENSITY_MAP: Record<number, RoastIntensity> = {
  1: 'light',
  2: 'savage',
  3: 'legendary'
};

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  emotion?: Emotion;
  character?: 'pakoda' | 'masala';
}

export interface GeminiResponse {
  text: string;
  emotion: Emotion;
}
