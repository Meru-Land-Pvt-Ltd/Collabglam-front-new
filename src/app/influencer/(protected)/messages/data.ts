// File: app/brand/(protected)/messages/data.ts
import { get } from "@/lib/api";

export interface Brand {
  id: string;
  name: string;
}

interface RawBrand {
  brandId: string;
  name: string;
}

/**
 * Fetch & normalize all influencers
 */
export async function getInfluencers(): Promise<Brand[]> {
  const raw = await get<RawBrand[]>("/brand/getall");
  return raw.map((i) => ({
    id: i.brandId,
    name: i.name,
  }));
}

/**
 * Look up a single influencer by ID
 */
export async function getInfluencerById(
  id: string
): Promise<Brand | null> {
  const list = await getInfluencers();
  return list.find((inf) => inf.id === id) ?? null;
}
