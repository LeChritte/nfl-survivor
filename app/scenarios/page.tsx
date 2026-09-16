'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Picks } from '@/components/BoardClient';
import type { OddsCache } from '@/lib/oddsApi';
import type { SurvivorGridCache } from '@/app/api/survivor-grid/route';
import { spreadToWinPct } from '@/lib/winProb';

interface Scenario {
  name: string;
  picks: Picks;
  savedAt: string;
}

interface OddsEntry {
  spread: number;
  winPct: number;
  source: 'live' | 'projected';
}

const DOUBLE_WEEKS = new Set([9, 12, 13, 14, 15, 16]);
const weeks = Array.from({ length: 18 }, (_, i) => i + 1);

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [oddsMap, setOddsMap] = useState(new Map<string, OddsEntry>());

  useEffect(() => {
    try {
      const raw = localStorage.getItem('survivor_scenarios_v1');
      if (raw) setScenarios(JSON.parse(raw));
    } catch { /* ignore */ }

    Promise.all([
      fetch('/api/odds').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/survivor-grid').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([live, proj]: [OddsCache | null, SurvivorGridCache | null]) => {
      const map = new Map<string, OddsEntry>();
      if (proj) {
        for (const e of proj.entries) {
          if (e.spread !== null && e.winPct !== null) {
            map.set(`${e.teamCode}_${e.week}`, { spread: e.spread, winPct: e.winPct, source: 'projected' });
          }
        }
      }
      // Live odds overwrite projected
      if (live) {
        for (const e of live.entries) {
          map.set(`${e.teamCode}_${e.week}`, { spread: e.spread, winPct: e.winPct, source: 'live' });
        }
      }
      setOddsMap(map);
    });
  }, []);

  function deleteScenario(i: number) {
    if (!window.confirm(`Delete "${scenarios[i].name}"?`)) return;
    const next = scenarios.filter((_, j) => j !== i);
    setScenarios(next);
    localStorage.setItem('survivor_scenarios_v1', JSON.stringify(next));
  }

  if (scenarios.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 16px', textAlign: 'center', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>
        <h1 style={{ fontSize: '1.35rem', marginBottom: 8 }}>🏈 Saved Scenarios</h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: 24 }}>
          No scenarios saved yet. Go back to the board, build a plan, and click <b>Save scenario</b>.
        </p>
        <Link href="/board" style={{ color: 'var(--accent)' }}>← Back to board</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: '16px 16px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.35rem', margin: 0 }}>🏈 Saved Scenarios</h1>
        <Link href="/board" style={{ fontSize: '.82rem', color: 'var(--accent)' }}>← Back to board</Link>
        <span style={{ fontSize: '.72rem', color: 'var(--text-dim)' }}>
          {oddsMap.size > 0 ? '📡 Odds loaded' : '⏳ Loading odds…'}
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="scheduletable" style={{ minWidth: 400 }}>
          <thead>
            <tr>
              <th className="teamcell" style={{ minWidth: 72 }}>Week</th>
              {scenarios.map((s, i) => (
                <th key={i} style={{ minWidth: 130, textAlign: 'center', position: 'relative', padding: '6px 20px 6px 8px' }}>
                  <div style={{ fontWeight: 700 }}>{s.name}</div>
                  <div style={{ fontWeight: 400, fontSize: '.65rem', color: 'var(--text-dim)' }}>
                    saved {new Date(s.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <button
                    onClick={() => deleteScenario(i)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '.7rem', padding: '2px 4px', position: 'absolute', top: 4, right: 4 }}
                    title="Delete scenario"
                  >✕</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map(w => {
              const isDouble = DOUBLE_WEEKS.has(w);
              return (
                <tr key={w}>
                  <td className="teamcell" style={{ fontWeight: 700, fontSize: '.82rem' }}>
                    Wk {w}
                    {isDouble && <span style={{ marginLeft: 4, fontSize: '.62rem', color: 'var(--bad)', fontWeight: 700 }}>×2</span>}
                  </td>
                  {scenarios.map((s, i) => {
                    const picked = s.picks[String(w)] || [];
                    return (
                      <td key={i} style={{ textAlign: 'center', padding: '5px 8px', verticalAlign: 'middle' }}>
                        {picked.length > 0
                          ? picked.map((t, j) => {
                              const odds = oddsMap.get(`${t}_${w}`);
                              const spread = odds
                                ? (odds.spread === 0 ? 'PK' : odds.spread > 0 ? `+${odds.spread}` : String(odds.spread))
                                : null;
                              const wp = odds ? Math.round(spreadToWinPct(odds.spread)) : null;
                              const isLive = odds?.source === 'live';
                              const wpColor = wp === null ? 'var(--text-dim)'
                                : wp >= 75 ? 'var(--good)'
                                : wp >= 60 ? 'var(--ok)'
                                : 'var(--bad)';
                              return (
                                <div
                                  key={t}
                                  style={{
                                    display: 'inline-block',
                                    background: 'var(--chip-bg)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 7,
                                    padding: '3px 8px',
                                    marginLeft: j > 0 ? 4 : 0,
                                    textAlign: 'center',
                                    minWidth: 52,
                                  }}
                                >
                                  <div style={{ fontWeight: 700, fontSize: '.82rem' }}>{t}</div>
                                  {spread && (
                                    <div style={{ fontSize: '.65rem', color: 'var(--text-dim)', lineHeight: 1.3 }}>{spread}</div>
                                  )}
                                  {wp !== null && (
                                    <div style={{ fontSize: '.65rem', fontWeight: 700, color: wpColor, lineHeight: 1.3 }}>
                                      {isLive ? '' : '~'}{wp}%
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          : <span style={{ color: 'var(--text-dim)', fontSize: '.72rem' }}>—</span>
                        }
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--border)' }}>
              <td className="teamcell" style={{ fontWeight: 700, fontSize: '.72rem', color: 'var(--text-dim)' }}>Teams used</td>
              {scenarios.map((s, i) => {
                const count = new Set(Object.values(s.picks).flat()).size;
                return (
                  <td key={i} style={{ textAlign: 'center', fontSize: '.82rem', fontWeight: 700, padding: '6px 8px' }}>
                    {count}/32
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
