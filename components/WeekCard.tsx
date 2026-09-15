'use client';

import { useState } from 'react';
import type { TeamSchedule, WeekEntry } from '@/lib/schedule';
import type { Pick } from '@/lib/rules';
import { spreadToWinPct } from '@/lib/winProb';
import WinProbBadge from './WinProbBadge';

interface WeekCardProps {
  week: number;
  isDouble: boolean;
  picks: Pick[];
  selectedTeam: string | null;
  teams: TeamSchedule[];
  byeTeams: string[];
  onSlotTap: (slot: number) => void;
  onRemovePick: (slot: number) => void;
  onDrop: (slot: number) => void;
}

function formatSpread(spread: number): string {
  if (spread === 0) return 'PK';
  return spread > 0 ? `+${spread.toFixed(1)}` : spread.toFixed(1);
}

function formatOpponent(entry: WeekEntry): string {
  if (entry.loc === 'A') return `@ ${entry.opp}`;
  if (entry.loc === 'N') return `N vs ${entry.opp}`;
  return `vs ${entry.opp}`;
}

interface SlotProps {
  slot: number;
  pick: Pick | undefined;
  teams: TeamSchedule[];
  selectedTeam: string | null;
  isDragOver: boolean;
  onTap: () => void;
  onRemove: () => void;
  onDrop: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
}

function Slot({ slot, pick, teams, selectedTeam, isDragOver, onTap, onRemove, onDrop, onDragOver, onDragLeave }: SlotProps) {
  if (pick) {
    const team = teams.find((t) => t.code === pick.teamCode);
    const weekEntry = team?.weeks[pick.week];
    const spread = weekEntry?.fallbackSpread ?? 0;
    const winPct = spreadToWinPct(spread);

    return (
      <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 border border-green-700">
        <div className="flex-1 min-w-0">
          <span className="font-bold text-green-400">{pick.teamCode}</span>
          {weekEntry && (
            <span className="text-gray-400 text-xs ml-1">{formatOpponent(weekEntry)}</span>
          )}
          {weekEntry && (
            <span className="text-gray-400 text-xs ml-1">({formatSpread(weekEntry.fallbackSpread)})</span>
          )}
        </div>
        <WinProbBadge winPct={winPct} isFallback />
        <button
          onClick={onRemove}
          className="text-gray-500 hover:text-red-400 text-sm ml-1 leading-none"
          aria-label="Remove pick"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onTap}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`w-full flex items-center justify-center rounded-lg px-3 py-2 border-2 border-dashed transition-all text-sm min-h-[44px]
        ${isDragOver
          ? 'border-amber-400 bg-amber-500/10 text-amber-300'
          : selectedTeam
          ? 'border-blue-500 bg-blue-500/10 text-blue-300 animate-pulse'
          : 'border-gray-700 text-gray-600 hover:border-gray-500 hover:text-gray-500'
        }`}
    >
      {selectedTeam ? `Tap to assign ${selectedTeam} →` : '— pick a team —'}
    </button>
  );
}

export default function WeekCard({
  week,
  isDouble,
  picks,
  selectedTeam,
  teams,
  onSlotTap,
  onRemovePick,
  onDrop,
}: WeekCardProps) {
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  const slotsNeeded = isDouble ? [0, 1] : [0];

  return (
    <div className="bg-gray-900 rounded-xl p-3 border border-gray-800">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-gray-300 text-sm">Week {week}</span>
        {isDouble && (
          <span className="text-[10px] font-bold bg-amber-500 text-black px-1.5 py-0.5 rounded uppercase tracking-wide">
            2 Picks Required
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        {slotsNeeded.map((slot) => (
          <Slot
            key={slot}
            slot={slot}
            pick={picks.find((p) => p.slot === slot)}
            teams={teams}
            selectedTeam={selectedTeam}
            isDragOver={dragOverSlot === slot}
            onTap={() => onSlotTap(slot)}
            onRemove={() => onRemovePick(slot)}
            onDrop={() => { setDragOverSlot(null); onDrop(slot); }}
            onDragOver={(e) => { e.preventDefault(); setDragOverSlot(slot); }}
            onDragLeave={() => setDragOverSlot(null)}
          />
        ))}
      </div>
    </div>
  );
}
