'use client';

import { useState } from 'react';
import type { TeamSchedule } from '@/lib/schedule';
import { spreadToWinPct } from '@/lib/winProb';
import type { CellInfo, Picks } from './BoardClient';

interface ScheduleGridProps {
  teams: TeamSchedule[];
  picks: Picks;
  getCell: (team: string, week: number) => CellInfo | null;
  doubleWeeks: number[];
}

type GridSort = { week: number | null; dir: 'asc' | 'desc' };

function starString(fv: number): string {
  const full = Math.floor(fv);
  const half = fv - full >= 0.5;
  const s = '★'.repeat(full) + (half ? '½' : '');
  return s || '–';
}

export default function ScheduleGrid({ teams, picks, getCell, doubleWeeks }: ScheduleGridProps) {
  const [sort, setSort] = useState<GridSort>({ week: null, dir: 'desc' });
  const weeks = Array.from({ length: 18 }, (_, i) => i + 1);

  const usedMap: Record<string, number> = {};
  for (const [w, arr] of Object.entries(picks)) {
    for (const t of arr) usedMap[t] = parseInt(w, 10);
  }

  function handleWeekSort(w: number) {
    setSort(prev => prev.week === w
      ? { week: w, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
      : { week: w, dir: 'desc' }
    );
  }

  const sorted = [...teams].sort((a, b) => {
    if (!sort.week) return a.code.localeCompare(b.code);
    const ca = getCell(a.code, sort.week);
    const cb = getCell(b.code, sort.week);
    const pa = ca ? spreadToWinPct(ca.spread) : -1;
    const pb = cb ? spreadToWinPct(cb.spread) : -1;
    if (pa < 0 && pb < 0) return a.code.localeCompare(b.code);
    if (pa < 0) return 1;
    if (pb < 0) return -1;
    return sort.dir === 'desc' ? pb - pa : pa - pb;
  });

  return (
    <div className="gridwrap">
      <table className="scheduletable">
        <thead>
          <tr>
            <th
              className="teamcell sortable"
              onClick={() => setSort({ week: null, dir: 'desc' })}
              title="Click to reset to alphabetical"
            >
              Team
            </th>
            {weeks.map(w => {
              const active = sort.week === w;
              const arrow = active ? (sort.dir === 'desc' ? ' ▼' : ' ▲') : '';
              return (
                <th
                  key={w}
                  className={`sortable${doubleWeeks.includes(w) ? ' dblcol' : ''}${active ? ' sort-active' : ''}`}
                  onClick={() => handleWeekSort(w)}
                  title="Click to sort by this week's win %"
                >
                  Wk{w}{doubleWeeks.includes(w) ? ' (2)' : ''}{arrow}
                </th>
              );
            })}
            <th>FV</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(team => {
            const isUsed = team.code in usedMap;
            return (
              <tr key={team.code} className={isUsed ? 'usedrow' : ''}>
                <td className="teamcell">
                  {team.code}
                  {isUsed && <span style={{ fontWeight: 400, textDecoration: 'none', color: 'var(--text-dim)' }}> (Wk {usedMap[team.code]})</span>}
                </td>
                {weeks.map(w => {
                  const cell = getCell(team.code, w);
                  if (!cell) {
                    return <td key={w} className="byecell">BYE</td>;
                  }
                  const wp = spreadToWinPct(cell.spread);
                  const winCls = wp >= 75 ? 'win-g' : wp >= 60 ? 'win-y' : 'win-r';
                  const locSym = cell.loc === 'H' ? 'vs' : cell.loc === 'A' ? '@' : 'N-';
                  const isPicked = (picks[String(w)] || []).includes(team.code);
                  return (
                    <td key={w} className={isPicked ? 'pickedcell' : ''}>
                      <span className={winCls} style={{ padding: '1px 4px', borderRadius: 4 }}>
                        {locSym}{cell.opp}
                      </span>
                      <br />
                      <span className="gspread">{cell.spread > 0 ? '+' : ''}{cell.spread}</span>
                    </td>
                  );
                })}
                <td className="fvcell">{starString(team.futureVal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
