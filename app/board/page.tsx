import seedData from '@/data/nfl_survivor_seed_data.json';
import BoardClient from '@/components/BoardClient';
import type { SeedData } from '@/lib/schedule';
import { fetchAndMatchOdds } from '@/lib/oddsApi';
import type { OddsCache } from '@/lib/oddsApi';

export const revalidate = 43200;

export default async function BoardPage() {
  let oddsCache: OddsCache | null = null;
  try {
    oddsCache = await fetchAndMatchOdds();
  } catch {
    // fall through — BoardClient handles null gracefully
  }

  return <BoardClient seedData={seedData as unknown as SeedData} oddsCache={oddsCache} />;
}
