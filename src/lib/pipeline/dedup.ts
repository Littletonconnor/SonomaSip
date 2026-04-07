/**
 * Fuzzy deduplication for winery discovery.
 *
 * Three matching signals:
 * 1. Name similarity (Levenshtein distance on normalized names)
 * 2. Geographic proximity (Haversine distance in meters)
 * 3. Domain match (exact match on extracted domain)
 */

export interface WineryCandidate {
  name: string;
  latitude?: number;
  longitude?: number;
  website_url?: string;
}

export interface MatchResult {
  matched: boolean;
  score: number;
  reasons: string[];
}

const GEO_PROXIMITY_METERS = 200;

/**
 * Name distance threshold scales with length. Short names (≤4 chars) need
 * an exact match to avoid false positives like "hall" ↔ "nalle".
 */
function nameDistanceThreshold(normalizedName: string): number {
  const len = normalizedName.length;
  if (len <= 4) return 0;
  if (len <= 8) return 1;
  if (len <= 12) return 2;
  return 3;
}

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(winery|vineyards?|cellars?|estate|wines?|tasting room)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractDomain(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

export function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[b.length][a.length];
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function matchWinery(candidate: WineryCandidate, existing: WineryCandidate): MatchResult {
  const reasons: string[] = [];
  let score = 0;

  const normA = normalizeName(candidate.name);
  const normB = normalizeName(existing.name);
  const dist = levenshtein(normA, normB);
  const threshold = nameDistanceThreshold(normA.length <= normB.length ? normA : normB);
  if (dist <= threshold) {
    score += 3;
    reasons.push(`name distance=${dist} ("${normA}" vs "${normB}")`);
  }

  if (
    candidate.latitude != null &&
    candidate.longitude != null &&
    existing.latitude != null &&
    existing.longitude != null
  ) {
    const meters = haversineMeters(
      candidate.latitude,
      candidate.longitude,
      existing.latitude,
      existing.longitude,
    );
    if (meters <= GEO_PROXIMITY_METERS) {
      score += 2;
      reasons.push(`geo proximity=${Math.round(meters)}m`);
    }
  }

  const domainA = extractDomain(candidate.website_url);
  const domainB = extractDomain(existing.website_url);
  if (domainA && domainB && domainA === domainB) {
    score += 4;
    reasons.push(`domain match="${domainA}"`);
  }

  // Geo proximity alone is not sufficient — different wineries can be neighbors.
  // Require at least a name or domain signal (score ≥ 3).
  const hasNameOrDomain = score >= 3;

  return {
    matched: hasNameOrDomain,
    score,
    reasons,
  };
}

/**
 * Find the best match for a candidate among a list of existing wineries.
 * Returns the index of the best match and the match result, or null if no match.
 */
export function findBestMatch(
  candidate: WineryCandidate,
  existingWineries: WineryCandidate[],
): { index: number; result: MatchResult } | null {
  let best: { index: number; result: MatchResult } | null = null;

  for (let i = 0; i < existingWineries.length; i++) {
    const result = matchWinery(candidate, existingWineries[i]);
    if (result.matched && (!best || result.score > best.result.score)) {
      best = { index: i, result };
    }
  }

  return best;
}
