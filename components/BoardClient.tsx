'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { SeedData } from '@/lib/schedule';
import { getTeams, getWeekEntry, getDoubleWeeks, getByeTeams } from '@/lib/schedule';
import { spreadToWinPct } from '@/lib/winProb';
import type { OddsCache } from '@/lib/oddsApi';
import TeamPool from './TeamPool';
import WeekBoard from './WeekBoard';
import ScheduleGrid from './ScheduleGrid';
import Toast from './Toast';

interface BoardClientProps {
  seedData: SeedData;
  oddsCache: OddsCache | null;
}

export type CellInfo = { opp: string; spread: number; loc: string; isLive: boolean };
export type Picks = Record<string, string[]>;
export type Overrides = Record<string, { opp: string; spread: number; loc: string }>;

const DOUBLE_WEEKS = new Set([9, 12, 13, 14, 15, 16]);
const LS_KEY = 'survivor_pool_planner_state_v1';

const SUGGESTED: Record<string, string[]> = {
  '2': ['TB'], '3': ['SF'], '4': ['MIN'], '5': ['CIN'], '6': ['LAR'],
  '7': ['HOU'], '8': ['DAL'], '9': ['KC', 'SEA'], '10': ['IND'],
  '11': ['LAC'], '12': ['JAX', 'WSH'], '13': ['DEN', 'PHI'],
  '14': ['CHI', 'DET'], '15': ['GB', 'NYG'], '16': ['BAL', 'NO'],
  '17': ['BUF'], '18': ['NE'],
};

function starString(fv: number): string {
  const full = Math.floor(fv);
  const half = fv - full >= 0.5;
  const s = '★'.repeat(full) + (half ? '½' : '');
  return s || '–';
}

export default function BoardClient({ seedData: _seedData, oddsCache }: BoardClientProps) {
  const router = useRouter();
  const teams = getTeams();
  const doubleWeeks = getDoubleWeeks();

  // Build lookup: "TEAMCODE_week" → LiveOddsEntry
  const liveOddsMap = new Map<string, { spread: number; winPct: number }>();
  if (oddsCache) {
    for (const e of oddsCache.entries) {
      liveOddsMap.set(`${e.teamCode}_${e.week}`, { spread: e.spread, winPct: e.winPct });
    }
  }

  const [playerName, setPlayerName] = useState('');
  const [picks, setPicks] = useState<Picks>({});
  const [overrides, setOverrides] = useState<Overrides>({});
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const name = localStorage.getItem('survivor_player_name');
    if (!name) { router.replace('/'); return; }
    setPlayerName(name);
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.picks) setPicks(saved.picks);
        if (saved?.overrides) setOverrides(saved.overrides);
      }
    } catch { /* ignore */ }
  }, [router]);

  function persist(p: Picks, o: Overrides) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ picks: p, overrides: o, updatedAt: Date.now() }));
    } catch { showToast("Couldn't save — storage may be blocked."); }
  }

  function showToast(msg: string) {
    setToast(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2600);
  }

  function getCell(team: string, week: number): CellInfo | null {
    const key = `${team}_${week}`;
    if (overrides[key]) return { ...overrides[key], isLive: false };
    const entry = getWeekEntry(team, week);
    if (!entry) return null;
    const live = liveOddsMap.get(key);
    if (live) return { opp: entry.opp, spread: live.spread, loc: entry.loc, isLive: true };
    return { opp: entry.opp, spread: entry.fallbackSpread, loc: entry.loc, isLive: false };
  }

  function usedTeamsMap(): Record<string, number> {
    const m: Record<string, number> = {};
    for (const [w, arr] of Object.entries(picks)) {
      for (const t of arr) m[t] = parseInt(w, 10);
    }
    return m;
  }

  function assign(team: string, week: number) {
    const used = usedTeamsMap();
    if (used[team] !== undefined) {
      showToast(`${team} is already used in Week ${used[team]}.`);
      return;
    }
    const cell = getCell(team, week);
    if (!cell) {
      showToast(`${team} is on BYE in Week ${week} — can't pick them.`);
      return;
    }
    const arr = picks[String(week)] ? [...picks[String(week)]] : [];
    const need = DOUBLE_WEEKS.has(week) ? 2 : 1;
    if (arr.length >= need) {
      showToast(`Week ${week} already has ${need} pick${need > 1 ? 's' : ''}.`);
      return;
    }
    const newPicks = { ...picks, [String(week)]: [...arr, team] };
    setPicks(newPicks);
    setSelectedTeam(null);
    persist(newPicks, overrides);
  }

  function unassign(week: number, team: string) {
    const arr = (picks[String(week)] || []).filter(t => t !== team);
    const newPicks = { ...picks };
    if (arr.length) newPicks[String(week)] = arr;
    else delete newPicks[String(week)];
    setPicks(newPicks);
    persist(newPicks, overrides);
  }

  function editCell(team: string, week: number) {
    const cell = getCell(team, week) || { opp: '', spread: 0, loc: 'H' };
    const input = window.prompt(
      `Edit ${team} Week ${week} matchup.\nFormat: OPP SPREAD LOC  (LOC = H/A/N)\nExample: BUF -3.5 H\n(Use a positive number if ${team} is the underdog.)`,
      `${cell.opp} ${cell.spread} ${cell.loc}`
    );
    if (input === null) return;
    const parts = input.trim().split(/\s+/);
    if (parts.length < 2) { showToast("Couldn't parse that — no change made."); return; }
    const opp = parts[0].toUpperCase();
    const spread = parseFloat(parts[1]);
    const loc = (parts[2] || 'H').toUpperCase();
    if (isNaN(spread)) { showToast('Spread must be a number.'); return; }
    const newOverrides = { ...overrides, [`${team}_${week}`]: { opp, spread, loc } };
    setOverrides(newOverrides);
    persist(picks, newOverrides);
  }

  function handleSlotTap(week: number) {
    if (!selectedTeam) { showToast('Tap a team below first, then tap this slot.'); return; }
    assign(selectedTeam, week);
  }

  function handleDropTeam(team: string, week: number) {
    assign(team, week);
  }

  function handleReset() {
    if (!window.confirm('Clear every pick? This can\'t be undone.')) return;
    setPicks({});
    setOverrides({});
    setSelectedTeam(null);
    persist({}, {});
  }

  function exportCSV() {
    const rows = [['Week', 'Slot', 'Team', 'Opponent', 'Location', 'Spread', 'Est. Win %', 'Double-Pick Week']];
    for (let w = 1; w <= 18; w++) {
      const need = DOUBLE_WEEKS.has(w) ? 2 : 1;
      const weekPicks = picks[String(w)] || [];
      for (let i = 0; i < need; i++) {
        const team = weekPicks[i];
        if (team) {
          const cell = getCell(team, w);
          const wp = cell ? Math.round(spreadToWinPct(cell.spread)) + '%' : '';
          const locFull = !cell ? '' : cell.loc === 'H' ? 'Home' : cell.loc === 'A' ? 'Away' : 'Neutral';
          rows.push([String(w), String(i + 1), team, cell?.opp ?? '', locFull, String(cell?.spread ?? ''), wp, DOUBLE_WEEKS.has(w) ? 'Yes' : 'No']);
        } else {
          rows.push([String(w), String(i + 1), '', '', '', '', '', DOUBLE_WEEKS.has(w) ? 'Yes' : 'No']);
        }
      }
    }
    const csv = rows.map(r => r.join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'survivor_pool_picks.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Downloaded survivor_pool_picks.csv');
  }

  function showLegend() {
    window.alert(
      'How this works:\n\n' +
      '• Drag a team chip onto a week\'s slot (or tap the team, then tap a slot).\n' +
      '• Each team can be used once all season.\n' +
      '• Weeks 9, 12, 13, 14, 15 & 16 need TWO correct picks to survive that week.\n' +
      '• A team greyed out is already used — hover/tap to see which week.\n' +
      '• Stars = \'Future Value\': how much stronger this team\'s remaining schedule gets later. Higher-star teams are usually worth saving for the Week 12–16 stretch.\n' +
      '• The win% badge is a rough estimate from the point spread — not a guarantee.\n' +
      '• Click the pencil icon on any matchup to correct the opponent/spread if the Vegas line has moved since this was built.'
    );
  }

  const usedMap = usedTeamsMap();
  const usedCount = Object.keys(usedMap).length;
  const remaining = 32 - usedCount;
  let picksNeeded = 0, weeksOpen = 0;
  for (let w = 1; w <= 18; w++) {
    const have = (picks[String(w)] || []).length;
    const need = DOUBLE_WEEKS.has(w) ? 2 : 1;
    const missing = Math.max(0, need - have);
    picksNeeded += missing;
    if (missing > 0) weeksOpen++;
  }
  const cushion = remaining - picksNeeded;
  const cushionClass = cushion <= 2 ? 'stat warn' : cushion > 5 ? 'stat good' : 'stat';

  if (!playerName) return null;

  return (
    <div className="wrap">
      <h1>🏈 Survivor Pool Planner</h1>
      <p className="info-banner">
        📎 Picks save in <b>this browser automatically</b> (localStorage). Use &ldquo;Export to Excel&rdquo; for a portable backup.
        &nbsp;Drag teams onto a week (or tap a team, then tap a slot). One team per contest, ever. Weeks 9, 12&ndash;16 need <b>two</b> correct picks.
        &nbsp;·&nbsp;
        {oddsCache
          ? <>📡 Live odds as of {new Date(oddsCache.fetchedAt).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}. Win% marked <b>~</b> are preseason estimates.</>
          : <>📊 Odds: preseason estimates only (~ prefix). Live odds unavailable.</>
        }
      </p>

      <div className="topbar">
        <div className="stats">
          <div className="stat"><b>{usedCount}/32</b><span>Teams used</span></div>
          <div className="stat"><b>{remaining}</b><span>Teams left</span></div>
          <div className="stat"><b>{picksNeeded}</b><span>Picks still needed ({weeksOpen} weeks open)</span></div>
          <div className={cushionClass}><b>{cushion}</b><span>Spare-team cushion</span></div>
        </div>
        <div className="btnrow">
          <button className="small" onClick={showLegend}>Legend</button>
          <button className="small" onClick={exportCSV}>Export to Excel</button>
          <button className="small" onClick={handleReset}>Reset all picks</button>
        </div>
      </div>

      {/* Reference plan */}
      <details className="suggest">
        <summary>📋 Reference plan (computed from today&apos;s lines — a starting point, not gospel)</summary>
        <p className="note" style={{ marginTop: 8 }}>
          This is one mathematically strong allocation given <b>today&apos;s</b> spreads, built to save your best teams for the crowded double-pick stretch (weeks 12&ndash;16).
          Odds will move a lot between now and December — re-check before each week. Click &ldquo;Use&rdquo; on any week to auto-fill it, only if those teams are still unused.
        </p>
        <div className="suggestgrid">
          {Object.keys(SUGGESTED).map(Number).sort((a, b) => a - b).map(w => {
            const sugTeams = SUGGESTED[String(w)];
            const allAvail = sugTeams.every(t => usedMap[t] === undefined);
            return (
              <div key={w} className="sg-item">
                <b>Week {w}{DOUBLE_WEEKS.has(w) ? ' (2)' : ''}</b><br />
                {sugTeams.join(' + ')}
                {allAvail ? (
                  <div>
                    <button className="small fillbtn" onClick={() => {
                      const clash = sugTeams.find(t => usedMap[t] !== undefined);
                      if (clash) { showToast(`${clash} is already used — can't apply.`); return; }
                      const newPicks = { ...picks, [String(w)]: [...sugTeams] };
                      setPicks(newPicks);
                      persist(newPicks, overrides);
                    }}>Use</button>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-dim)' }}>already committed differently</div>
                )}
              </div>
            );
          })}
        </div>
      </details>

      {/* Schedule grid */}
      <details className="suggest gridview">
        <summary>🗂️ Full schedule grid (all 32 teams &times; 18 weeks)</summary>
        <p className="note" style={{ marginTop: 8 }}>
          Every team&apos;s full slate at a glance. &ldquo;@&rdquo; = away, &ldquo;vs&rdquo; = home, &ldquo;N&rdquo; = neutral site.
          Color matches the win% badges elsewhere (green ≥75%, yellow 60&ndash;75%, red &lt;60%).
          <b> Click any week&apos;s header to sort every team by that week&apos;s win% — best pick on top; click it again to flip to worst-first.</b>
          A green outline marks a cell you&apos;ve picked; a whole row grays out once that team is used.
          Click &ldquo;Team&rdquo; to go back to A&ndash;Z.
        </p>
        <ScheduleGrid teams={teams} picks={picks} getCell={getCell} doubleWeeks={doubleWeeks} />
      </details>

      <div className="layout">
        <TeamPool
          teams={teams}
          usedMap={usedMap}
          selectedTeam={selectedTeam}
          onSelect={(code) => setSelectedTeam(prev => prev === code ? null : code)}
        />
        <WeekBoard
          picks={picks}
          selectedTeam={selectedTeam}
          doubleWeeks={doubleWeeks}
          teams={teams}
          getCell={getCell}
          onSlotTap={handleSlotTap}
          onUnassign={unassign}
          onDropTeam={handleDropTeam}
          onEditCell={editCell}
          onShowToast={showToast}
        />
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
