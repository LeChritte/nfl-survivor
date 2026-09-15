'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { SeedData, TeamSchedule } from '@/lib/schedule';
import { getTeams, getDoubleWeeks } from '@/lib/schedule';
import type { Pick } from '@/lib/rules';
import { validatePick, usedTeams, picksForWeek } from '@/lib/rules';
import TeamPool from './TeamPool';
import WeekBoard from './WeekBoard';
import ScheduleGrid from './ScheduleGrid';
import Toast from './Toast';

interface BoardClientProps {
  seedData: SeedData;
}

const WEEKS = Array.from({ length: 18 }, (_, i) => i + 1);

export default function BoardClient({ seedData: _seedData }: BoardClientProps) {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [picks, setPicks] = useState<Pick[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
  const [activeView, setActiveView] = useState<'board' | 'grid'>('board');
  const dragTeamRef = useRef<string | null>(null);

  const teams: TeamSchedule[] = getTeams();
  const doubleWeeks = getDoubleWeeks();

  useEffect(() => {
    const name = localStorage.getItem('survivor_player_name');
    if (!name) {
      router.replace('/');
      return;
    }
    setPlayerName(name);
    try {
      const stored = localStorage.getItem('survivor_picks');
      if (stored) setPicks(JSON.parse(stored));
    } catch {
      setPicks([]);
    }
  }, [router]);

  useEffect(() => {
    if (playerName) {
      localStorage.setItem('survivor_picks', JSON.stringify(picks));
    }
  }, [picks, playerName]);

  const showToast = useCallback((message: string, type: 'error' | 'info' = 'error') => {
    setToast({ message, type });
  }, []);

  const handleTeamSelect = useCallback((teamCode: string) => {
    setSelectedTeam((prev) => (prev === teamCode ? null : teamCode));
  }, []);

  const handleSlotTap = useCallback(
    (week: number, slot: number) => {
      if (!selectedTeam) {
        showToast('Tap a team first to select it', 'info');
        return;
      }
      const result = validatePick(selectedTeam, week, slot, picks);
      if (!result.valid) {
        showToast(result.message ?? result.error ?? 'Invalid pick');
        return;
      }
      setPicks((prev) => [...prev, { week, slot, teamCode: selectedTeam }]);
      setSelectedTeam(null);
    },
    [selectedTeam, picks, showToast]
  );

  const handleRemovePick = useCallback((week: number, slot: number) => {
    setPicks((prev) => prev.filter((p) => !(p.week === week && p.slot === slot)));
  }, []);

  const handleDragStart = useCallback((teamCode: string) => {
    dragTeamRef.current = teamCode;
  }, []);

  const handleDrop = useCallback(
    (week: number, slot: number) => {
      const teamCode = dragTeamRef.current;
      dragTeamRef.current = null;
      if (!teamCode) return;
      const result = validatePick(teamCode, week, slot, picks);
      if (!result.valid) {
        showToast(result.message ?? result.error ?? 'Invalid pick');
        return;
      }
      setPicks((prev) => [...prev, { week, slot, teamCode }]);
    },
    [picks, showToast]
  );

  const handleReset = useCallback(() => {
    if (confirm('Reset all picks? This cannot be undone.')) {
      setPicks([]);
      setSelectedTeam(null);
    }
  }, []);

  const used = usedTeams(picks);
  const currentWeek = WEEKS.find((w) => picksForWeek(picks, w).length === 0) ?? 18;
  const selectedTeamObj = selectedTeam ? teams.find((t) => t.code === selectedTeam) : null;

  if (!playerName) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-2 px-3 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
        <span className="font-bold text-amber-400 mr-1">🏈</span>
        <span className="font-semibold truncate max-w-[100px]">{playerName}</span>
        <span className="text-gray-500 text-xs">{used.length}/32 used</span>
        <div className="flex-1" />
        <div className="flex gap-1">
          <button
            onClick={() => setActiveView('board')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${activeView === 'board' ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            Board
          </button>
          <button
            onClick={() => setActiveView('grid')}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${activeView === 'grid' ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            Grid
          </button>
        </div>
        <button
          onClick={handleReset}
          className="px-2 py-1 rounded text-xs bg-gray-800 text-red-400 hover:bg-gray-700 ml-1"
        >
          Reset
        </button>
      </header>

      {/* Selection banner */}
      {selectedTeam && selectedTeamObj && (
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-amber-500/20 border-b border-amber-500/40 text-amber-200 text-sm">
          <span className="flex-1">
            Selecting: <strong>{selectedTeamObj.fullName}</strong> — tap a week slot to assign
          </span>
          <button onClick={() => setSelectedTeam(null)} className="text-amber-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {activeView === 'grid' ? (
        /* Grid view: full scroll */
        <div className="flex-1 overflow-auto p-2">
          <ScheduleGrid teams={teams} picks={picks} />
        </div>
      ) : (
        /* Board view: mobile = week board + fixed bottom pool; desktop = side-by-side */
        <>
          {/* Desktop side-by-side */}
          <div className="hidden lg:flex flex-1 overflow-hidden">
            {/* Team pool — left sidebar */}
            <div className="w-72 shrink-0 border-r border-gray-800 overflow-y-auto">
              <div className="px-2 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Teams (by future value)
              </div>
              <TeamPool
                teams={teams}
                picks={picks}
                usedTeamCodes={used}
                selectedTeam={selectedTeam}
                currentWeek={currentWeek}
                onSelect={handleTeamSelect}
                onDragStart={handleDragStart}
              />
            </div>
            {/* Week board — right */}
            <div className="flex-1 overflow-y-auto">
              <WeekBoard
                weeks={WEEKS}
                picks={picks}
                selectedTeam={selectedTeam}
                doubleWeeks={doubleWeeks}
                teams={teams}
                onSlotTap={handleSlotTap}
                onRemovePick={handleRemovePick}
                onDrop={handleDrop}
              />
            </div>
          </div>

          {/* Mobile: week board scrolls, team pool fixed at bottom */}
          <div className="lg:hidden flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto pb-2">
              <WeekBoard
                weeks={WEEKS}
                picks={picks}
                selectedTeam={selectedTeam}
                doubleWeeks={doubleWeeks}
                teams={teams}
                onSlotTap={handleSlotTap}
                onRemovePick={handleRemovePick}
                onDrop={handleDrop}
              />
            </div>
            {/* Fixed bottom team pool */}
            <div className="shrink-0 border-t border-gray-800 bg-gray-950 max-h-44 overflow-y-auto">
              <div className="px-2 pt-1.5 pb-0.5 text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                Tap a team to select
              </div>
              <TeamPool
                teams={teams}
                picks={picks}
                usedTeamCodes={used}
                selectedTeam={selectedTeam}
                currentWeek={currentWeek}
                onSelect={handleTeamSelect}
                onDragStart={handleDragStart}
              />
            </div>
          </div>
        </>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}
