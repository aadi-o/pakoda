export enum Emotion {
  NEUTRAL = 'NEUTRAL',
  ANNOYED = 'ANNOYED',
  CONFIDENT = 'CONFIDENT',
  SAVAGE = 'SAVAGE',
  ANGRY = 'ANGRY'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  emotion?: Emotion;
}

export interface GeminiResponse {
  text: string;
  emotion: Emotion;
}
