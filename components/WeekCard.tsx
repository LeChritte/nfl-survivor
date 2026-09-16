'use client';

import { useState } from 'react';
import type { TeamSchedule } from '@/lib/schedule';
import { spreadToWinPct } from '@/lib/winProb';
import type { CellInfo, Results } from './BoardClient';

interface WeekCardProps {
  week: number;
  isDouble: boolean;
  weekPicks: string[];
  results: Results;
  selectedTeam: string | null;
  teams: TeamSchedule[];
  byeTeams: string[];
  getCell: (team: string, week: number) => CellInfo | null;
  onSlotTap: () => void;
  onUnassign: (team: string) => void;
  onDropTeam: (team: string) => void;
  onEditCell: (team: string) => void;
  onShowToast: (msg: string) => void;
}

export default function WeekCard({
  week, isDouble, weekPicks, results, selectedTeam, teams, byeTeams,
  getCell, onSlotTap, onUnassign, onDropTeam, onEditCell, onShowToast,
}: WeekCardProps) {
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const need = isDouble ? 2 : 1;
  const slots = Array.from({ length: need }, (_, i) => i);

  // Determine week-level result for border/background
  const filledPicks = weekPicks.filter(Boolean);
  const weekDone = filledPicks.length === need;
  const allWon = weekDone && filledPicks.every(t => results[`${t}_${week}`] === 'W');
  const anyLost = filledPicks.some(t => results[`${t}_${week}`] === 'L');
  const weekCls = allWon ? ' won' : anyLost ? ' lost' : '';

  return (
    <div className={`week${weekCls}`}>
      <div className="wkhead">
        <span className="wknum">Week {week}</span>
        {isDouble && <span className="badge-dbl">2 PICKS</span>}
      </div>

      {slots.map(i => {
        const team = weekPicks[i];
        if (team) {
          const cell = getCell(team, week);
          const wp = cell ? spreadToWinPct(cell.spread) / 100 : 0.5;
          const winCls = wp >= 0.75 ? 'win-g' : wp >= 0.60 ? 'win-y' : 'win-r';
          const spreadTxt = !cell ? '' : cell.spread === 0 ? 'PK' : cell.spread > 0 ? `+${cell.spread}` : String(cell.spread);
          const locTxt = !cell ? '' : cell.loc === 'H' ? 'vs' : cell.loc === 'A' ? '@' : 'vs* ';

          return (
            <div key={i} className="slot filled">
              <div className="pickrow">
                <div>
                  <div className="team">{team}</div>
                  {cell && (
                    <div className="matchup">
                      {locTxt} {cell.opp} &nbsp;({spreadTxt})
                      <span
                        className="edit-icon"
                        title="Edit this matchup / spread"
                        onClick={() => onEditCell(team)}
                      >✎</span>
                    </div>
                  )}
                  {results[`${team}_${week}`] === 'W'
                    ? <span className="winchip win-g">✓ 100% — Won</span>
                    : results[`${team}_${week}`] === 'L'
                    ? <span className="winchip win-r">✗ Lost</span>
                    : cell?.source === 'live'
                    ? <span className={`winchip ${winCls}`}>{Math.round(wp * 100)}% win</span>
                    : cell?.source === 'projected'
                    ? <span className="winchip" style={{ background: 'var(--panel-2)', color: 'var(--text-dim)' }}>~{Math.round(wp * 100)}% est</span>
                    : <span className="winchip" style={{ background: 'var(--panel-2)', color: 'var(--text-dim)' }}>N/A</span>
                  }
                </div>
                <button className="rm" title="Remove pick" onClick={() => onUnassign(team)}>✕</button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={i}
            className={`slot${dragOverSlot === i ? ' dragover' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOverSlot(i); }}
            onDragLeave={() => setDragOverSlot(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverSlot(null);
              const t = e.dataTransfer.getData('text/plain');
              if (t) onDropTeam(t);
            }}
            onClick={() => {
              if (!selectedTeam) { onShowToast('Tap a team below first, then tap this slot.'); return; }
              onSlotTap();
            }}
            style={{ cursor: 'pointer' }}
          >
            {selectedTeam ? `Tap → ${selectedTeam}` : 'Pick a team'}
          </div>
        );
      })}

      {byeTeams.length > 0 && (
        <div className="byelist">On bye: {byeTeams.join(', ')}</div>
      )}
    </div>
  );
}
