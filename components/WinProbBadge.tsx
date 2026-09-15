interface WinProbBadgeProps {
  winPct: number;
  isFallback?: boolean;
}

export default function WinProbBadge({ winPct, isFallback }: WinProbBadgeProps) {
  const rounded = Math.round(winPct);
  let colorClass = 'bg-red-600 text-white';
  if (winPct >= 75) colorClass = 'bg-green-600 text-white';
  else if (winPct >= 60) colorClass = 'bg-yellow-500 text-black';

  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${colorClass}`}>
      {isFallback ? '~' : ''}{rounded}%
    </span>
  );
}
