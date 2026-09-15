import { spreadToWinPct, moneylineToWinPct } from '../lib/winProb';

describe('spreadToWinPct', () => {
  it('spread=0 → 50%', () => {
    expect(spreadToWinPct(0)).toBeCloseTo(50.0, 1);
  });

  it('spread=-7 → ~69.3%', () => {
    expect(spreadToWinPct(-7)).toBeCloseTo(69.3, 0);
  });

  it('spread=-14 → ~84.2%', () => {
    expect(spreadToWinPct(-14)).toBeCloseTo(84.2, 0);
  });

  it('spread=+7 → ~30.7%', () => {
    expect(spreadToWinPct(7)).toBeCloseTo(30.7, 0);
  });

  it('spread=-3 → ~58.6%', () => {
    expect(spreadToWinPct(-3)).toBeCloseTo(58.6, 0);
  });

  it('symmetry: pct(-s) + pct(+s) ≈ 100', () => {
    const s = 10;
    expect(spreadToWinPct(-s) + spreadToWinPct(s)).toBeCloseTo(100, 1);
  });
});

describe('moneylineToWinPct', () => {
  it('moneyline -150/+130 → ~57-58% for favorite', () => {
    const pct = moneylineToWinPct(-150, 130);
    expect(pct).toBeGreaterThanOrEqual(57);
    expect(pct).toBeLessThanOrEqual(58);
  });

  it('moneyline -300/+250 → ~72-75% for favorite', () => {
    const pct = moneylineToWinPct(-300, 250);
    expect(pct).toBeGreaterThanOrEqual(72);
    expect(pct).toBeLessThanOrEqual(75);
  });
});
