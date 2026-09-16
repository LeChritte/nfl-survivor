import type { TeamSchedule } from '@/lib/schedule';
import TeamChip from './TeamChip';

interface TeamPoolProps {
  teams: TeamSchedule[];
  usedMap: Record<string, number>;
  selectedTeam: string | null;
  onSelect: (code: string) => void;
}

export default function TeamPool({ teams, usedMap, selectedTeam, onSelect }: TeamPoolProps) {
  const sorted = [...teams].sort((a, b) => (b.futureVal - a.futureVal) || a.code.localeCompare(b.code));

  return (
    <div className="panel pool">
      <h2>All 32 Teams — tap a team, then tap a week slot</h2>
      <div className="teamgrid">
        {sorted.map(team => (
          <TeamChip
            key={team.code}
            code={team.code}
            fullName={team.fullName}
            futureVal={team.futureVal}
            isUsed={team.code in usedMap}
            usedWeek={usedMap[team.code]}
            isSelected={selectedTeam === team.code}
            onSelect={() => { if (!(team.code in usedMap)) onSelect(team.code); }}
          />
        ))}
      </div>
      <div className="legend">
        <div className="row"><span className="dot" style={{ background: 'var(--gold)' }}></span> Stars = &ldquo;Future Value&rdquo; &mdash; how much better this team&apos;s spots get later. Save high-star teams for weeks 9 &amp; 12&ndash;16.</div>
        <div className="row"><span className="dot" style={{ background: 'var(--good)' }}></span> Win% badge: green ≥75%, yellow 60&ndash;75%, red &lt;60% (rough model from the spread, not a guarantee).</div>
        <div className="row">Tap a team then tap a slot on mobile. Byes block that team for that week automatically.</div>
      </div>
    </div>
  );
}
