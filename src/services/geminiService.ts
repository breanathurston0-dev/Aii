import { StorySummary, SubtitleSegment, SystemStatus, VoiceProfile } from '../types/studio';

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const res = await fetch('/api/status');
  if (!res.ok) throw new Error('Failed to fetch system status');
  return res.json();
}

export async function generateStorySummary(
  text: string,
  mode: 'short' | 'medium' | 'detailed',
  tone: string,
  targetLanguage: string = 'en'
): Promise<StorySummary> {
  const res = await fetch('/api/ai/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, mode, tone, targetLanguage }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Summarization failed' }));
    throw new Error(err.error || 'Failed to generate story summary');
  }

  const data = await res.json();
  return {
    ...data,
    tone,
    length: mode,
    createdAt: new Date().toISOString(),
  };
}

export async function translateTextOrSegments(
  text?: string,
  segments?: SubtitleSegment[],
  sourceLanguage: string = 'auto',
  targetLanguage: string = 'km'
): Promise<{ translatedText?: string; segments?: SubtitleSegment[] }> {
  const res = await fetch('/api/ai/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, segments, sourceLanguage, targetLanguage }),
  });

  if (!res.ok) {
    throw new Error('Translation failed');
  }

  return res.json();
}

export async function generateTtsAudio(
  text: string,
  voice: string = 'Kore',
  language: string = 'km',
  speed: number = 1.0
): Promise<{ audioBase64: string; mimeType: string; durationSeconds: number; provider: string; voice: string }> {
  const res = await fetch('/api/ai/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice, language, speed }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'TTS request failed' }));
    throw new Error(err.error || 'TTS synthesis failed');
  }

  return res.json();
}

export async function registerClonedVoice(params: {
  name: string;
  ownerName: string;
  consentAccepted: boolean;
  referenceFileName?: string;
  language: string;
}): Promise<VoiceProfile> {
  const res = await fetch('/api/ai/voice-clone-register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Voice registration failed' }));
    throw new Error(err.error || 'Voice profile registration failed');
  }

  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
    gender: 'neutral',
    language: data.language,
    languageName: data.language === 'km' ? 'Khmer (ខ្មែរ)' : 'English',
    provider: 'custom_clone',
    voiceIdentifier: data.id,
    isCloned: true,
    consentVerified: true,
    ownerName: data.ownerName,
    timbreDescription: `Acoustic timbre score ${data.acousticFingerprint.timbreWarmthScore}/100, F0: ${data.acousticFingerprint.fundamentalFrequencyHz}Hz`,
  };
}

export async function separateAudioVocals(fileName: string, model: string = 'htdemucs') {
  const res = await fetch('/api/ai/separate-vocals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, model }),
  });

  if (!res.ok) {
    throw new Error('Vocal separation failed');
  }

  return res.json();
}
