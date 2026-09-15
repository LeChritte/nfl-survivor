import type { TeamSchedule } from '@/lib/schedule';
import { getByeTeams } from '@/lib/schedule';
import type { CellInfo, Picks } from './BoardClient';
import WeekCard from './WeekCard';

interface WeekBoardProps {
  picks: Picks;
  selectedTeam: string | null;
  doubleWeeks: number[];
  teams: TeamSchedule[];
  getCell: (team: string, week: number) => CellInfo | null;
  onSlotTap: (week: number) => void;
  onUnassign: (week: number, team: string) => void;
  onDropTeam: (team: string, week: number) => void;
  onEditCell: (team: string, week: number) => void;
  onShowToast: (msg: string) => void;
}

export default function WeekBoard({
  picks, selectedTeam, doubleWeeks, teams, getCell,
  onSlotTap, onUnassign, onDropTeam, onEditCell, onShowToast,
}: WeekBoardProps) {
  const weeks = Array.from({ length: 18 }, (_, i) => i + 1);

  return (
    <div className="panel">
      <h2>Weeks 1–18</h2>
      <div className="weeks">
        {weeks.map(week => (
          <WeekCard
            key={week}
            week={week}
            isDouble={doubleWeeks.includes(week)}
            weekPicks={picks[String(week)] || []}
            selectedTeam={selectedTeam}
            teams={teams}
            byeTeams={getByeTeams(week)}
            getCell={getCell}
            onSlotTap={() => onSlotTap(week)}
            onUnassign={(team) => onUnassign(week, team)}
            onDropTeam={(team) => onDropTeam(team, week)}
            onEditCell={(team) => onEditCell(team, week)}
            onShowToast={onShowToast}
          />
        ))}
      </div>
    </div>
  );
}
