'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('survivor_player_name');
    if (stored) {
      router.replace('/board');
    } else {
      setChecked(true);
    }
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    localStorage.setItem('survivor_player_name', trimmed);
    router.push('/board');
  }

  if (!checked) return null;

  return (
    <div className="wrap" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="panel" style={{ maxWidth: 360, width: '100%' }}>
        <h1>🏈 Survivor Pool Planner</h1>
        <p className="sub" style={{ marginTop: 8 }}>Enter your name to get started.</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="text"
            placeholder="Your name (e.g. Andrew)"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              font: 'inherit', fontSize: '.9rem', padding: '9px 12px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--panel-2)',
              color: 'var(--text)', outline: 'none',
            }}
            autoFocus
          />
          <button type="submit" className="primary">Enter Pool →</button>
        </form>
      </div>
    </div>
  );
}
