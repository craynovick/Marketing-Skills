/** Convert our supported Markdown subset into readable clipboard text. */
export function copyText(markdown: string) {
  return markdown.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^#{1,6}\s+.*\n?/, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1 ($2)')
    .replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1')
    .replace(/^```[^\n]*\n?/gm, '').replace(/^>\s?/gm, '').trim();
}
