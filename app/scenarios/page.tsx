'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Picks } from '@/components/BoardClient';

interface Scenario {
  name: string;
  picks: Picks;
  savedAt: string;
}

const DOUBLE_WEEKS = new Set([9, 12, 13, 14, 15, 16]);
const weeks = Array.from({ length: 18 }, (_, i) => i + 1);

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('survivor_scenarios_v1');
      if (raw) setScenarios(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  function deleteScenario(i: number) {
    if (!window.confirm(`Delete "${scenarios[i].name}"?`)) return;
    const next = scenarios.filter((_, j) => j !== i);
    setScenarios(next);
    localStorage.setItem('survivor_scenarios_v1', JSON.stringify(next));
  }

  if (scenarios.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 16px', textAlign: 'center' }}>
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
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="scheduletable" style={{ minWidth: 400 }}>
          <thead>
            <tr>
              <th className="teamcell" style={{ minWidth: 80 }}>Week</th>
              {scenarios.map((s, i) => (
                <th key={i} style={{ minWidth: 120, textAlign: 'center', position: 'relative' }}>
                  <div>{s.name}</div>
                  <div style={{ fontWeight: 400, fontSize: '.65rem', color: 'var(--text-dim)' }}>
                    {new Date(s.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <button
                    onClick={() => deleteScenario(i)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '.7rem', padding: '0 2px', position: 'absolute', top: 4, right: 4 }}
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
                  <td className="teamcell" style={{ fontWeight: 700 }}>
                    Wk {w}{isDouble ? <span style={{ marginLeft: 4, fontSize: '.65rem', color: 'var(--bad)', fontWeight: 700 }}>×2</span> : ''}
                  </td>
                  {scenarios.map((s, i) => {
                    const teams = s.picks[String(w)] || [];
                    return (
                      <td key={i} style={{ textAlign: 'center', padding: '5px 8px' }}>
                        {teams.length > 0
                          ? teams.map((t, j) => (
                              <span
                                key={t}
                                style={{
                                  display: 'inline-block',
                                  background: 'var(--chip-bg)',
                                  border: '1px solid var(--border)',
                                  borderRadius: 6,
                                  padding: '1px 6px',
                                  fontSize: '.78rem',
                                  fontWeight: 700,
                                  marginLeft: j > 0 ? 4 : 0,
                                }}
                              >
                                {t}
                              </span>
                            ))
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
            <tr>
              <td className="teamcell" style={{ fontWeight: 700, fontSize: '.72rem', color: 'var(--text-dim)' }}>Teams used</td>
              {scenarios.map((s, i) => {
                const count = new Set(Object.values(s.picks).flat()).size;
                return (
                  <td key={i} style={{ textAlign: 'center', fontSize: '.82rem', fontWeight: 700 }}>
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
