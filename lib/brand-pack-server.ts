import { account } from '@/lib/cookbook-server';
import { packColumns, type BrandPack } from '@/lib/brand-pack';

export const brandPacksEnabled = () => process.env.COOKBOOK_BRAND_PACKS_ENABLED === 'true';
export async function packAccount() {
  if (!brandPacksEnabled()) throw new Error('PACKS_DISABLED');
  try { return await account(); }
  catch (error) { if (error instanceof Error && error.message === 'AUTH_REQUIRED') throw new Error('PACK_AUTH_REQUIRED'); throw error; }
}
export async function ownedPack(db: Awaited<ReturnType<typeof account>>['db'], userId: string, id: string): Promise<BrandPack> {
  const { data, error } = await db.from('cookbook_brand_packs').select(packColumns).eq('id', id).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('NOT_FOUND');
  return data as BrandPack;
}
