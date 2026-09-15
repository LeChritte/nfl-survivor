import seedData from '@/data/nfl_survivor_seed_data.json';

export interface WeekEntry {
  opp: string;
  loc: 'H' | 'A' | 'N';
  fallbackSpread: number;
}

export interface TeamSchedule {
  code: string;
  fullName: string;
  futureVal: number;
  weeks: Record<number, WeekEntry | null>;
}

export interface ScheduleMeta {
  doubleWeeks: number[];
  totalWeeks: number;
}

export interface SeedData {
  meta: ScheduleMeta;
  teams: Record<string, { fullName: string; futureVal: number; weeks: Record<string, WeekEntry | null> }>;
}

const data = seedData as SeedData;

export function getTeams(): TeamSchedule[] {
  return Object.entries(data.teams).map(([code, team]) => ({
    code,
    fullName: team.fullName,
    futureVal: team.futureVal,
    weeks: Object.fromEntries(
      Object.entries(team.weeks).map(([w, entry]) => [Number(w), entry])
    ) as Record<number, WeekEntry | null>,
  }));
}

export function getWeekEntry(teamCode: string, week: number): WeekEntry | null | undefined {
  const team = data.teams[teamCode];
  if (!team) return undefined;
  const entry = team.weeks[String(week)];
  return entry === undefined ? undefined : entry;
}

export function getByeTeams(week: number): string[] {
  return Object.entries(data.teams)
    .filter(([, team]) => team.weeks[String(week)] === null)
    .map(([code]) => code);
}

export function getDoubleWeeks(): number[] {
  return data.meta.doubleWeeks;
}

export function picksNeededForWeek(week: number): number {
  return data.meta.doubleWeeks.includes(week) ? 2 : 1;
}
