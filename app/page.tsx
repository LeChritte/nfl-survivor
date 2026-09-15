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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-2">🏈 NFL Survivor Pool</h1>
        <p className="text-gray-400 text-center text-sm mb-8">
          Pick one team per week. Don&apos;t lose. Don&apos;t repeat.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="text-sm font-medium text-gray-300">What&apos;s your name?</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Andrew"
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-lg transition-colors"
          >
            Enter Pool →
          </button>
        </form>
      </div>
    </div>
  );
}
