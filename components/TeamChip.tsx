function starString(fv: number): string {
  const full = Math.floor(fv);
  const half = fv - full >= 0.5;
  const s = '★'.repeat(full) + (half ? '½' : '');
  return s || '–';
}

interface TeamChipProps {
  code: string;
  fullName: string;
  futureVal: number;
  isUsed: boolean;
  usedWeek?: number;
  isSelected: boolean;
  onSelect: () => void;
}

export default function TeamChip({ code, fullName, futureVal, isUsed, usedWeek, isSelected, onSelect }: TeamChipProps) {
  return (
    <div
      className={`chip${isUsed ? ' used' : ''}${isSelected ? ' selected' : ''}`}
      title={fullName}
      draggable={!isUsed}
      onClick={!isUsed ? onSelect : undefined}
      onDragStart={!isUsed ? (e) => { e.dataTransfer.setData('text/plain', code); e.dataTransfer.effectAllowed = 'move'; } : undefined}
    >
      <div className="code">{code}</div>
      <div className="stars">{starString(futureVal)}</div>
      {isUsed && usedWeek !== undefined && <div className="usedwk">Wk {usedWeek}</div>}
    </div>
  );
}
