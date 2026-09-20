export const platforms = [
  { id: 'linkedin', name: 'LinkedIn', format: 'Professional post with a useful opening, clear insight, and natural call to action.' },
  { id: 'instagram', name: 'Instagram', format: 'Caption, or slide copy when a carousel is requested; use readable line breaks.' },
  { id: 'facebook', name: 'Facebook', format: 'Conversational community post with relevant context.' },
  { id: 'x', name: 'X', format: 'Concise post of at most 280 characters unless a thread is explicitly requested.' },
  { id: 'threads', name: 'Threads', format: 'Conversational post of at most 500 characters unless a thread is requested.' },
  { id: 'tiktok', name: 'TikTok', format: 'Short video concept: hook, spoken script, visual cues, and caption. Do not claim a video was generated.' },
  { id: 'youtube-shorts', name: 'YouTube Shorts', format: 'Short video concept: hook, spoken script, visual cues, title, and description. Do not claim a video was generated.' },
] as const;
export type PlatformId = typeof platforms[number]['id'];
export function adaptationPrompt(platform: string) {
  const selected = platforms.find(p => p.id === platform);
  return `Adapt the saved source draft for ${selected?.name || platform}. ${selected?.format || ''} Follow the saved voice direction and preserve supported facts. Save only this platform's finished draft. Keep notes outside usable copy.`;
}
