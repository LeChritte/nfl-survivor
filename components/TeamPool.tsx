import type { TeamSchedule } from '@/lib/schedule';
import { getByeTeams } from '@/lib/schedule';
import { picksForWeek } from '@/lib/rules';
import type { Pick } from '@/lib/rules';
import TeamChip from './TeamChip';

interface TeamPoolProps {
  teams: TeamSchedule[];
  picks: Pick[];
  usedTeamCodes: string[];
  selectedTeam: string | null;
  currentWeek: number;
  onSelect: (code: string) => void;
  onDragStart: (code: string) => void;
}

export default function TeamPool({
  teams,
  picks,
  usedTeamCodes,
  selectedTeam,
  currentWeek,
  onSelect,
  onDragStart,
}: TeamPoolProps) {
  const byeTeams = getByeTeams(currentWeek);
  const sorted = [...teams].sort((a, b) => b.futureVal - a.futureVal);

  function getUsedWeek(code: string): number | undefined {
    const p = picks.find((pk) => pk.teamCode === code);
    return p?.week;
  }

  return (
    <div className="p-2">
      <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-1.5">
        {sorted.map((team) => (
          <TeamChip
            key={team.code}
            team={team}
            isUsed={usedTeamCodes.includes(team.code)}
            usedWeek={getUsedWeek(team.code)}
            isSelected={selectedTeam === team.code}
            isByeThisWeek={byeTeams.includes(team.code)}
            onClick={() => {
              if (!usedTeamCodes.includes(team.code)) onSelect(team.code);
            }}
            onDragStart={() => onDragStart(team.code)}
          />
        ))}
      </div>
    </div>
  );
}
