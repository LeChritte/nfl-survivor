import { getByeTeams, picksNeededForWeek } from './schedule';

export interface Pick {
  week: number;
  slot: number;
  teamCode: string;
}

export type ValidationError =
  | 'TEAM_ALREADY_USED'
  | 'TEAM_ON_BYE'
  | 'SLOT_OCCUPIED'
  | 'WEEK_FULL'
  | 'INVALID_WEEK';

export interface ValidationResult {
  valid: boolean;
  error?: ValidationError;
  message?: string;
}

export function usedTeams(picks: Pick[]): string[] {
  return picks.map((p) => p.teamCode);
}

export function picksForWeek(picks: Pick[], week: number): Pick[] {
  return picks.filter((p) => p.week === week);
}

export function isEliminated(_picks: Pick[]): boolean {
  return false;
}

export function validatePick(
  teamCode: string,
  week: number,
  slot: number,
  existingPicks: Pick[]
): ValidationResult {
  if (week < 1 || week > 18 || !Number.isInteger(week)) {
    return { valid: false, error: 'INVALID_WEEK', message: `Week ${week} is not valid (must be 1–18).` };
  }

  const byeTeams = getByeTeams(week);
  if (byeTeams.includes(teamCode)) {
    return { valid: false, error: 'TEAM_ON_BYE', message: `${teamCode} is on bye in Week ${week}.` };
  }

  if (usedTeams(existingPicks).includes(teamCode)) {
    const usedIn = existingPicks.find((p) => p.teamCode === teamCode)?.week;
    return {
      valid: false,
      error: 'TEAM_ALREADY_USED',
      message: `${teamCode} was already used in Week ${usedIn}.`,
    };
  }

  const weekPicks = picksForWeek(existingPicks, week);
  const slotTaken = weekPicks.some((p) => p.slot === slot);
  if (slotTaken) {
    return { valid: false, error: 'SLOT_OCCUPIED', message: `Slot ${slot + 1} for Week ${week} is already filled.` };
  }

  const needed = picksNeededForWeek(week);
  if (slot !== 0 && needed === 1) {
    return { valid: false, error: 'WEEK_FULL', message: `Week ${week} only requires 1 pick.` };
  }
  if (slot > 1) {
    return { valid: false, error: 'WEEK_FULL', message: `Invalid slot ${slot}.` };
  }

  return { valid: true };
}
