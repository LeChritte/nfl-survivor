'use client';

import { useEffect, useState } from 'react';
import type { Picks, CellInfo } from './BoardClient';
import type { TeamSchedule } from '@/lib/schedule';
import { spreadToWinPct } from '@/lib/winProb';

interface PlannerProps {
  teams: TeamSchedule[];
  currentPicks: Picks;
  getCell: (team: string, week: number) => CellInfo | null;
  onApply: (picks: Picks) => void;
}

const DOUBLE_WEEKS = new Set([9, 12, 13, 14, 15, 16]);

function runGreedy(
  currentPicks: Picks,
  excluded: Set<string>,
  skipped: Set<number>,
  teams: TeamSchedule[],
  getCell: (team: string, week: number) => CellInfo | null,
): Picks {
  const result: Picks = JSON.parse(JSON.stringify(currentPicks));
  const usedTeams = new Set(Object.values(result).flat());

  function available(w: number) {
    return teams.filter(t =>
      !usedTeams.has(t.code) &&
      !excluded.has(t.code) &&
      getCell(t.code, w) !== null
    );
  }

  const weeksToFill: number[] = [];
  for (let w = 1; w <= 18; w++) {
    if (skipped.has(w)) continue;
    const need = DOUBLE_WEEKS.has(w) ? 2 : 1;
    if ((result[String(w)] || []).length < need) weeksToFill.push(w);
  }

  // Fill most constrained weeks first; double-pick weeks before single
  weeksToFill.sort((a, b) => {
    const dblDiff = (DOUBLE_WEEKS.has(a) ? 0 : 1) - (DOUBLE_WEEKS.has(b) ? 0 : 1);
    return dblDiff !== 0 ? dblDiff : available(a).length - available(b).length;
  });

  for (const w of weeksToFill) {
    const need = DOUBLE_WEEKS.has(w) ? 2 : 1;
    const slotsLeft = need - (result[String(w)] || []).length;
    const candidates = available(w)
      .map(t => {
        const cell = getCell(t.code, w)!;
        const winPct = cell.source !== 'fallback' ? spreadToWinPct(cell.spread) : 50;
        return { code: t.code, winPct };
      })
      .sort((a, b) => b.winPct - a.winPct);

    for (let i = 0; i < slotsLeft && i < candidates.length; i++) {
      usedTeams.add(candidates[i].code);
      result[String(w)] = [...(result[String(w)] || []), candidates[i].code];
    }
  }
  return result;
}

export default function Planner({ teams, currentPicks, getCell, onApply }: PlannerProps) {
  const [excluded, setExcluded] = useState(new Set<string>());
  const [skipped, setSkipped] = useState(new Set<number>());
  const [suggestion, setSuggestion] = useState<Picks | null>(null);

  // Clear stale suggestion when picks or constraints change
  useEffect(() => { setSuggestion(null); }, [currentPicks]);

  const usedMap: Record<string, number> = {};
  for (const [w, arr] of Object.entries(currentPicks)) {
    for (const t of arr) usedMap[t] = parseInt(w, 10);
  }

  function toggleExclude(code: string) {
    setExcluded(prev => { const n = new Set(prev); n.has(code) ? n.delete(code) : n.add(code); return n; });
    setSuggestion(null);
  }

  function toggleSkip(w: number) {
    setSkipped(prev => { const n = new Set(prev); n.has(w) ? n.delete(w) : n.add(w); return n; });
    setSuggestion(null);
  }

  function handleGenerate() {
    setSuggestion(runGreedy(currentPicks, excluded, skipped, teams, getCell));
  }

  const sorted = [...teams].sort((a, b) => a.code.localeCompare(b.code));

  return (
    <div className="planner-body">
      <p className="note" style={{ marginTop: 0, marginBottom: 12 }}>
        Your current picks are locked in. Mark teams to avoid or weeks to skip, then Generate.
        Lock a future pick by placing it on the board first — the generator will work around it.
      </p>

      <div className="planner-section">
        <div className="planner-label">Teams to avoid</div>
        <div className="planner-chips">
          {sorted.map(t => (
            <button
              key={t.code}
              className={`pchip${excluded.has(t.code) ? ' excl' : ''}${usedMap[t.code] !== undefined ? ' pused' : ''}`}
              onClick={() => toggleExclude(t.code)}
              title={usedMap[t.code] !== undefined ? `Already used Wk ${usedMap[t.code]}` : excluded.has(t.code) ? 'Click to un-avoid' : 'Click to avoid'}
            >
              {t.code}
            </button>
          ))}
        </div>
      </div>

      <div className="planner-section">
        <div className="planner-label">Skip weeks — leave blank in the plan</div>
        <div className="planner-weeks">
          {Array.from({ length: 18 }, (_, i) => i + 1).map(w => {
            const hasPick = (currentPicks[String(w)] || []).length > 0;
            return (
              <button
                key={w}
                className={`pwk${skipped.has(w) ? ' excl' : ''}${hasPick ? ' pused' : ''}${DOUBLE_WEEKS.has(w) ? ' dbl' : ''}`}
                onClick={() => !hasPick && toggleSkip(w)}
                disabled={hasPick}
                title={hasPick ? 'Already has a pick' : DOUBLE_WEEKS.has(w) ? '2-pick week' : ''}
              >
                {w}
              </button>
            );
          })}
        </div>
      </div>

      <button className="primary" onClick={handleGenerate}>Generate plan</button>

      {suggestion && (
        <div className="suggest-result">
          <div className="suggest-result-hd">
            <span>Suggested plan</span>
            <button className="small" onClick={() => onApply(suggestion)}>Apply all</button>
          </div>
          <div className="suggestgrid">
            {Array.from({ length: 18 }, (_, i) => i + 1)
              .filter(w => !skipped.has(w))
              .map(w => {
                const locked = currentPicks[String(w)] || [];
                const newTeams = (suggestion[String(w)] || []).filter(t => !locked.includes(t));
                if (locked.length === 0 && newTeams.length === 0) return null;
                return (
                  <div key={w} className="sg-item">
                    <b>Wk {w}{DOUBLE_WEEKS.has(w) ? ' ⚡' : ''}</b>
                    {locked.length > 0 && (
                      <div style={{ color: 'var(--good)', fontSize: '.7rem', marginTop: 2 }}>
                        ✓ {locked.join(' + ')}
                      </div>
                    )}
                    {newTeams.length > 0 && (
                      <>
                        <div style={{ marginTop: 2 }}>
                          {newTeams.map((t, i) => {
                            const cell = getCell(t, w);
                            const wp = cell && cell.source !== 'fallback'
                              ? Math.round(spreadToWinPct(cell.spread)) + '%'
                              : null;
                            return (
                              <span key={t}>
                                {i > 0 ? ' + ' : ''}<b>{t}</b>{wp ? ` ${wp}` : ''}
                              </span>
                            );
                          })}
                        </div>
                        <button
                          className="small fillbtn"
                          onClick={() => onApply({ ...currentPicks, [String(w)]: [...locked, ...newTeams] })}
                        >
                          Use
                        </button>
                      </>
                    )}
                  </div>
                );
              })
              .filter(Boolean)}
          </div>
        </div>
      )}
    </div>
  );
}
