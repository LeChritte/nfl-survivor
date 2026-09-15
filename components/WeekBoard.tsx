import type { TeamSchedule } from '@/lib/schedule';
import { getByeTeams } from '@/lib/schedule';
import { picksForWeek } from '@/lib/rules';
import type { Pick } from '@/lib/rules';
import WeekCard from './WeekCard';

interface WeekBoardProps {
  weeks: number[];
  picks: Pick[];
  selectedTeam: string | null;
  doubleWeeks: number[];
  teams: TeamSchedule[];
  onSlotTap: (week: number, slot: number) => void;
  onRemovePick: (week: number, slot: number) => void;
  onDrop: (week: number, slot: number) => void;
}

export default function WeekBoard({
  weeks,
  picks,
  selectedTeam,
  doubleWeeks,
  teams,
  onSlotTap,
  onRemovePick,
  onDrop,
}: WeekBoardProps) {
  return (
    <div className="flex flex-col gap-2 p-2">
      {weeks.map((week) => (
        <WeekCard
          key={week}
          week={week}
          isDouble={doubleWeeks.includes(week)}
          picks={picksForWeek(picks, week)}
          selectedTeam={selectedTeam}
          teams={teams}
          byeTeams={getByeTeams(week)}
          onSlotTap={(slot) => onSlotTap(week, slot)}
          onRemovePick={(slot) => onRemovePick(week, slot)}
          onDrop={(slot) => onDrop(week, slot)}
        />
      ))}
    </div>
  );
}
