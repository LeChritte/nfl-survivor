const SIGMA = 13.86;

function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const poly =
    t *
    (0.254829592 +
      t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  return sign * (1 - poly * Math.exp(-x * x));
}

function normalCDF(x: number): number {
  return (1 + erf(x / Math.SQRT2)) / 2;
}

export function spreadToWinPct(spread: number): number {
  return normalCDF(-spread / SIGMA) * 100;
}

function americanToImplied(ml: number): number {
  if (ml < 0) {
    return -ml / (-ml + 100);
  } else {
    return 100 / (ml + 100);
  }
}

export function moneylineToWinPct(mlHome: number, mlAway: number): number {
  const impliedHome = americanToImplied(mlHome);
  const impliedAway = americanToImplied(mlAway);
  return (impliedHome / (impliedHome + impliedAway)) * 100;
}
