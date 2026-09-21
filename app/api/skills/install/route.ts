import { installerDownload } from '@/lib/brand-pack-download';
export const runtime = 'nodejs';
export function GET() {
  return new Response(installerDownload(), { headers: { 'Content-Type': 'text/javascript; charset=utf-8', 'Content-Disposition': 'attachment; filename="cookbook-install.mjs"', 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff' } });
}
