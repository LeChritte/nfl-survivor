import { getTeams } from '@/lib/schedule';
import { spreadToWinPct, moneylineToWinPct } from '@/lib/winProb';

export interface LiveOddsEntry {
  teamCode: string;
  week: number;
  spread: number;
  winPct: number;
  source: 'live';
  fetchedAt: string;
}

export interface OddsCache {
  fetchedAt: string;
  entries: LiveOddsEntry[];
}

interface OddsOutcome {
  name: string;
  price: number;
  point?: number;
}

interface OddsMarket {
  key: string;
  outcomes: OddsOutcome[];
}

interface OddsBookmaker {
  key: string;
  markets: OddsMarket[];
}

interface OddsGame {
  id: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsBookmaker[];
}

export async function fetchAndMatchOdds(): Promise<OddsCache | null> {
  try {
    const apiKey = process.env.ODDS_API_KEY;
    if (!apiKey) return null;

    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds?apiKey=${apiKey}&regions=us&markets=spreads,h2h&oddsFormat=american`,
      { next: { revalidate: 43200 } }
    );
    if (!res.ok) return null;

    const games: OddsGame[] = await res.json();
    const teams = getTeams();

    // fullName → teamCode lookup
    const nameToCode: Record<string, string> = {};
    for (const t of teams) nameToCode[t.fullName] = t.code;

    const fetchedAt = new Date().toISOString();
    const entries: LiveOddsEntry[] = [];

    for (const game of games) {
      const homeCode = nameToCode[game.home_team];
      const awayCode = nameToCode[game.away_team];
      if (!homeCode || !awayCode) continue;

      // Find which week this game is in by matching home team's schedule
      const homeTeam = teams.find(t => t.code === homeCode);
      if (!homeTeam) continue;

      let matchedWeek: number | null = null;
      for (let w = 1; w <= 18; w++) {
        const entry = homeTeam.weeks[w];
        if (entry && entry.opp === awayCode && entry.loc === 'H') {
          matchedWeek = w;
          break;
        }
        // neutral site: home team listed as home in API but loc='N' in our data
        if (entry && entry.opp === awayCode && entry.loc === 'N') {
          matchedWeek = w;
          break;
        }
      }
      if (!matchedWeek) continue;

      // Average spread across bookmakers (from home team's perspective)
      const spreadPoints: number[] = [];
      // Moneyline: [homeImplied, awayImplied] pairs
      const homeImplieds: number[] = [];
      const awayImplieds: number[] = [];

      for (const bk of game.bookmakers) {
        for (const market of bk.markets) {
          if (market.key === 'spreads') {
            const homeOutcome = market.outcomes.find(o => o.name === game.home_team);
            if (homeOutcome?.point !== undefined) spreadPoints.push(homeOutcome.point);
          }
          if (market.key === 'h2h') {
            const homeO = market.outcomes.find(o => o.name === game.home_team);
            const awayO = market.outcomes.find(o => o.name === game.away_team);
            if (homeO && awayO) {
              const hi = homeO.price < 0 ? -homeO.price / (-homeO.price + 100) : 100 / (homeO.price + 100);
              const ai = awayO.price < 0 ? -awayO.price / (-awayO.price + 100) : 100 / (awayO.price + 100);
              homeImplieds.push(hi);
              awayImplieds.push(ai);
            }
          }
        }
      }

      const avgSpreadHome = spreadPoints.length
        ? spreadPoints.reduce((a, b) => a + b, 0) / spreadPoints.length
        : null;

      const avgHomeImplied = homeImplieds.length
        ? homeImplieds.reduce((a, b) => a + b, 0) / homeImplieds.length
        : null;
      const avgAwayImplied = awayImplieds.length
        ? awayImplieds.reduce((a, b) => a + b, 0) / awayImplieds.length
        : null;

      // Home team entry
      const homeSpread = avgSpreadHome ?? 0;
      const homeWinPct = (avgHomeImplied !== null && avgAwayImplied !== null)
        ? (avgHomeImplied / (avgHomeImplied + avgAwayImplied)) * 100
        : spreadToWinPct(homeSpread);

      entries.push({
        teamCode: homeCode,
        week: matchedWeek,
        spread: homeSpread,
        winPct: homeWinPct,
        source: 'live',
        fetchedAt,
      });

      // Away team entry (spread is negated)
      const awaySpread = avgSpreadHome !== null ? -avgSpreadHome : 0;
      const awayWinPct = (avgHomeImplied !== null && avgAwayImplied !== null)
        ? (avgAwayImplied / (avgHomeImplied + avgAwayImplied)) * 100
        : spreadToWinPct(awaySpread);

      entries.push({
        teamCode: awayCode,
        week: matchedWeek,
        spread: awaySpread,
        winPct: awayWinPct,
        source: 'live',
        fetchedAt,
      });
    }

    return { fetchedAt, entries };
  } catch {
    return null;
  }
}
