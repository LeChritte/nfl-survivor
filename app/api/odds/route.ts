import { NextResponse } from 'next/server';
import { fetchAndMatchOdds } from '@/lib/oddsApi';

export const revalidate = 43200;

export async function GET() {
  const data = await fetchAndMatchOdds();
  if (!data) {
    return NextResponse.json({ error: 'odds unavailable' }, { status: 503 });
  }
  return NextResponse.json(data);
}
