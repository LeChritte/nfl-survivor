import { NextResponse } from 'next/server';
import { spreadToWinPct } from '@/lib/winProb';

export const revalidate = 3600; // cache 1 hour — site updates hourly

export interface SurvivorGridEntry {
  teamCode: string;
  week: number;
  spread: number | null; // null = BYE
  winPct: number | null; // null = BYE
}

export interface SurvivorGridCache {
  fetchedAt: string;
  currentWeek: number;
  entries: SurvivorGridEntry[];
}

export async function GET() {
  try {
    const res = await fetch('https://www.survivorgrid.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NFL Survivor Pool)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return NextResponse.json({ error: 'upstream failed' }, { status: 503 });

    const html = await res.text();

    // Extract current week from server-rendered menuData
    const menuMatch = html.match(/var menuData\s*=\s*({[^;]+})/);
    const currentWeek: number = menuMatch
      ? (JSON.parse(menuMatch[1]).currentWeek ?? 1)
      : 1;

    // Week number for each column, in order, from header data-sort="weekN"
    const weekCols: number[] = [];
    const hdrRe = /data-sort="week(\d+)"/g;
    let hm: RegExpExecArray | null;
    while ((hm = hdrRe.exec(html)) !== null) weekCols.push(parseInt(hm[1]));

    // Parse tbody rows
    const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
    if (!tbodyMatch) return NextResponse.json({ error: 'no table' }, { status: 503 });

    const entries: SurvivorGridEntry[] = [];
    const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
    let rm: RegExpExecArray | null;

    while ((rm = rowRe.exec(tbodyMatch[1])) !== null) {
      const rowHtml = rm[1];
      const teamMatch = rowHtml.match(/<td class="teamname">([A-Z0-9]+)<\/td>/);
      if (!teamMatch) continue;
      const teamCode = teamMatch[1];

      // Each td.gc is one week column, in the same order as weekCols
      const cellRe = /<td class="gc([^"]*)">([\s\S]*?)<\/td>/g;
      let cm: RegExpExecArray | null;
      let colIdx = 0;

      while ((cm = cellRe.exec(rowHtml)) !== null) {
        const week = weekCols[colIdx++];
        if (!week) continue;

        const cellClass = cm[1];
        const cellHtml = cm[2];

        if (/\bBYE\b/i.test(cellHtml) || cellClass.includes('bye')) {
          entries.push({ teamCode, week, spread: null, winPct: null });
          continue;
        }

        const spreadMatch = cellHtml.match(
          /<span class="spread">([+-]?\d+\.?\d*|PK)<\/span>/
        );
        if (!spreadMatch) continue;

        const spread = spreadMatch[1] === 'PK' ? 0 : parseFloat(spreadMatch[1]);
        const winPct = spreadToWinPct(spread);
        entries.push({ teamCode, week, spread, winPct });
      }
    }

    const cache: SurvivorGridCache = {
      fetchedAt: new Date().toISOString(),
      currentWeek,
      entries,
    };
    return NextResponse.json(cache);
  } catch {
    return NextResponse.json({ error: 'error' }, { status: 503 });
  }
}
