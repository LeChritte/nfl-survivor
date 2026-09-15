'use client';

import { useState } from 'react';
import type { TeamSchedule } from '@/lib/schedule';
import { spreadToWinPct } from '@/lib/winProb';
import type { Pick } from '@/lib/rules';
import WinProbBadge from './WinProbBadge';

interface ScheduleGridProps {
  teams: TeamSchedule[];
  picks: Pick[];
}

type SortState = { week: number | 'alpha'; dir: 'asc' | 'desc' };

function cellBg(winPct: number): string {
  if (winPct >= 75) return 'bg-green-900/40';
  if (winPct >= 60) return 'bg-yellow-900/30';
  return 'bg-red-900/30';
}

export default function ScheduleGrid({ teams, picks }: ScheduleGridProps) {
  const [sort, setSort] = useState<SortState>({ week: 'alpha', dir: 'asc' });

  const usedMap = new Map(picks.map((p) => [p.teamCode, p.week]));

  function handleWeekHeader(week: number) {
    setSort((prev) =>
      prev.week === week ? { week, dir: prev.dir === 'desc' ? 'asc' : 'desc' } : { week, dir: 'desc' }
    );
  }

  function handleAlphaHeader() {
    setSort({ week: 'alpha', dir: 'asc' });
  }

  const sorted = [...teams].sort((a, b) => {
    if (sort.week === 'alpha') return a.code.localeCompare(b.code);
    const entryA = a.weeks[sort.week];
    const entryB = b.weeks[sort.week];
    const pA = entryA ? spreadToWinPct(entryA.fallbackSpread) : -1;
    const pB = entryB ? spreadToWinPct(entryB.fallbackSpread) : -1;
    return sort.dir === 'desc' ? pB - pA : pA - pB;
  });

  const weeks = Array.from({ length: 18 }, (_, i) => i + 1);

  return (
    <div className="overflow-auto">
      <table className="text-xs border-collapse min-w-max">
        <thead>
          <tr>
            <th
              className="sticky left-0 z-10 bg-gray-950 px-3 py-2 text-left cursor-pointer hover:text-amber-400 border-b border-gray-700"
              onClick={handleAlphaHeader}
            >
              Team {sort.week === 'alpha' ? '↕' : ''}
            </th>
            {weeks.map((w) => (
              <th
                key={w}
                className="px-2 py-2 text-center cursor-pointer hover:text-amber-400 border-b border-gray-700 whitespace-nowrap"
                onClick={() => handleWeekHeader(w)}
              >
                Wk {w}
                {sort.week === w ? (sort.dir === 'desc' ? ' ↓' : ' ↑') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((team) => {
            const usedWeek = usedMap.get(team.code);
            const isUsed = usedWeek !== undefined;
            return (
              <tr key={team.code} className={isUsed ? 'opacity-50' : ''}>
                <td className="sticky left-0 z-10 bg-gray-950 px-3 py-1 font-bold border-r border-gray-800">
                  <span className={isUsed ? 'line-through text-gray-500' : ''}>{team.code}</span>
                </td>
                {weeks.map((w) => {
                  const entry = team.weeks[w];
                  const isPicked = picks.some((p) => p.teamCode === team.code && p.week === w);
                  if (!entry) {
                    return (
                      <td key={w} className="px-2 py-1 text-center text-gray-700 border border-gray-800/50">
                        BYE
                      </td>
                    );
                  }
                  const winPct = spreadToWinPct(entry.fallbackSpread);
                  const locSymbol = entry.loc === 'A' ? '@' : entry.loc === 'N' ? 'N' : 'vs';
                  return (
                    <td
                      key={w}
                      className={`px-1.5 py-1 text-center border border-gray-800/50 ${isPicked ? 'ring-1 ring-inset ring-green-500 !opacity-100' : cellBg(winPct)}`}
                    >
                      <div className="text-gray-300">{locSymbol} {entry.opp}</div>
                      <WinProbBadge winPct={winPct} isFallback />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
