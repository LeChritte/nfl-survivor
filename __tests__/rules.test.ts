import { validatePick, usedTeams, picksForWeek } from '../lib/rules';
import type { Pick } from '../lib/rules';

// LAC is on bye week 7, DET is on bye week 6
// Double weeks: 9, 12, 13, 14, 15, 16
// Single weeks: 1-8 (except 6 for DET), 10, 11, 17, 18

describe('validatePick', () => {
  it('empty picks → can pick a non-bye team', () => {
    const result = validatePick('LAC', 1, 0, []);
    expect(result.valid).toBe(true);
  });

  it('used team in week 3 → TEAM_ALREADY_USED in week 5', () => {
    const picks: Pick[] = [{ week: 3, slot: 0, teamCode: 'LAC' }];
    const result = validatePick('LAC', 5, 0, picks);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('TEAM_ALREADY_USED');
  });

  it('team on bye → TEAM_ON_BYE', () => {
    // LAC is on bye week 7
    const result = validatePick('LAC', 7, 0, []);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('TEAM_ON_BYE');
  });

  it('single-pick week already filled → SLOT_OCCUPIED', () => {
    const picks: Pick[] = [{ week: 1, slot: 0, teamCode: 'KC' }];
    const result = validatePick('LAC', 1, 0, picks);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('SLOT_OCCUPIED');
  });

  it('double-pick week: can fill slot 0 then slot 1', () => {
    const picks: Pick[] = [{ week: 9, slot: 0, teamCode: 'KC' }];
    const result = validatePick('LAC', 9, 1, picks);
    expect(result.valid).toBe(true);
  });

  it('double-pick week: same team in both slots → TEAM_ALREADY_USED', () => {
    const picks: Pick[] = [{ week: 9, slot: 0, teamCode: 'KC' }];
    const result = validatePick('KC', 9, 1, picks);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('TEAM_ALREADY_USED');
  });

  it('week 0 → INVALID_WEEK', () => {
    const result = validatePick('LAC', 0, 0, []);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('INVALID_WEEK');
  });

  it('week 19 → INVALID_WEEK', () => {
    const result = validatePick('LAC', 19, 0, []);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('INVALID_WEEK');
  });
});

describe('usedTeams', () => {
  it('extracts team codes from picks array', () => {
    const picks: Pick[] = [
      { week: 1, slot: 0, teamCode: 'KC' },
      { week: 2, slot: 0, teamCode: 'LAC' },
      { week: 9, slot: 0, teamCode: 'SF' },
      { week: 9, slot: 1, teamCode: 'LAR' },
    ];
    expect(usedTeams(picks)).toEqual(['KC', 'LAC', 'SF', 'LAR']);
  });

  it('returns empty array for no picks', () => {
    expect(usedTeams([])).toEqual([]);
  });
});

describe('picksForWeek', () => {
  it('filters picks by week', () => {
    const picks: Pick[] = [
      { week: 1, slot: 0, teamCode: 'KC' },
      { week: 9, slot: 0, teamCode: 'SF' },
      { week: 9, slot: 1, teamCode: 'LAR' },
    ];
    const week9 = picksForWeek(picks, 9);
    expect(week9).toHaveLength(2);
    expect(week9.map((p) => p.teamCode)).toContain('SF');
    expect(week9.map((p) => p.teamCode)).toContain('LAR');
  });

  it('returns empty array for unfilled week', () => {
    const picks: Pick[] = [{ week: 1, slot: 0, teamCode: 'KC' }];
    expect(picksForWeek(picks, 5)).toHaveLength(0);
  });
});
