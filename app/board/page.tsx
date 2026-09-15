import seedData from '@/data/nfl_survivor_seed_data.json';
import BoardClient from '@/components/BoardClient';
import type { SeedData } from '@/lib/schedule';

export default function BoardPage() {
  return <BoardClient seedData={seedData as unknown as SeedData} />;
}
