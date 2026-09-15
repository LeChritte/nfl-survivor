import type { TeamSchedule } from '@/lib/schedule';

interface TeamChipProps {
  team: TeamSchedule;
  isUsed: boolean;
  usedWeek?: number;
  isSelected: boolean;
  isByeThisWeek: boolean;
  onClick: () => void;
  onDragStart?: () => void;
}

export default function TeamChip({
  team,
  isUsed,
  usedWeek,
  isSelected,
  isByeThisWeek,
  onClick,
  onDragStart,
}: TeamChipProps) {
  const stars = '★'.repeat(Math.round(team.futureVal)) + '☆'.repeat(5 - Math.round(team.futureVal));

  if (isUsed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[44px] px-2 py-1 rounded-lg bg-gray-800 border border-gray-700 opacity-40 cursor-not-allowed select-none">
        <span className="text-xs font-bold text-gray-400 line-through">{team.code}</span>
        <span className="text-[10px] text-gray-500">Wk {usedWeek}</span>
      </div>
    );
  }

  return (
    <button
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`flex flex-col items-center justify-center min-h-[44px] px-2 py-1 rounded-lg border transition-all select-none
        ${isSelected
          ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400 text-amber-200'
          : 'bg-gray-800 border-gray-700 hover:border-gray-500 text-white'
        }`}
    >
      <span className="text-xs font-bold">{team.code}</span>
      <span className="text-[9px] text-yellow-400 leading-none">{stars}</span>
      {isByeThisWeek && (
        <span className="text-[8px] text-red-400 font-semibold">BYE</span>
      )}
    </button>
  );
}
