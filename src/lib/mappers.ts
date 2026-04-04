import type { Tables } from './database.types';
import type {
  Flight,
  FlightFormat,
  NoiseLevel,
  ReservationType,
  Setting,
  StyleScores,
  Varietal,
  WeeklyHours,
  WineryForDisplay,
  WineryForMatching,
} from './types';
import { AVA_TO_DISPLAY } from './types';

type WineryRow = Tables<'wineries'>;
type FlightRow = Tables<'flights'>;
type VarietalRow = Tables<'winery_varietals'>;

const VARIETAL_DISPLAY: Record<string, Varietal> = {
  pinot_noir: 'Pinot Noir',
  chardonnay: 'Chardonnay',
  cabernet_sauvignon: 'Cabernet Sauvignon',
  zinfandel: 'Zinfandel',
  sparkling: 'Sparkling',
  rose: 'Rosé',
  sauvignon_blanc: 'Sauvignon Blanc',
  merlot: 'Merlot',
  syrah: 'Syrah',
};

const DEFAULT_HOURS: WeeklyHours = {
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null,
  sunday: null,
};

function parseHours(raw: unknown): WeeklyHours {
  if (!raw || typeof raw !== 'object') return DEFAULT_HOURS;
  return { ...DEFAULT_HOURS, ...(raw as WeeklyHours) };
}

function mapStyleScores(row: WineryRow): StyleScores {
  return {
    styleRelaxed: row.style_classic ?? 3,
    styleAdventurous: row.style_adventure ?? 3,
    styleEducational: row.style_sustainable ?? 3,
    styleCelebratory: row.style_luxury ?? 3,
    styleSocial: row.style_social ?? 3,
  };
}

function mapVarietals(rows: VarietalRow[]): Varietal[] {
  return rows.map((r) => VARIETAL_DISPLAY[r.varietal]).filter((v): v is Varietal => v != null);
}

function mapSignatureVarietals(rows: VarietalRow[]): Varietal[] {
  return rows
    .filter((r) => r.is_signature)
    .map((r) => VARIETAL_DISPLAY[r.varietal])
    .filter((v): v is Varietal => v != null);
}

function mapParking(row: WineryRow): string {
  if (row.parking_type && row.parking_notes) {
    return `${capitalize(row.parking_type)} — ${row.parking_notes}`;
  }
  return row.parking_notes || capitalize(row.parking_type || '') || 'Contact winery';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function toFlight(row: FlightRow): Flight {
  return {
    id: String(row.id),
    wineryId: row.winery_id,
    name: row.name,
    price: row.price ?? 0,
    durationMinutes: row.duration_minutes ?? 0,
    winesIncluded: row.wines_count ?? 0,
    format: (row.format ?? 'seated') as FlightFormat,
    hasFoodPairing: row.food_included,
    description: row.description ?? '',
  };
}

export function toWineryForDisplay(
  row: WineryRow,
  flightRows: FlightRow[],
  varietalRows: VarietalRow[],
): WineryForDisplay {
  const flights = flightRows.map(toFlight);
  const prices = flights.map((f) => f.price).filter((p) => p > 0);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline ?? '',
    story: row.description ?? '',
    region: AVA_TO_DISPLAY[row.ava_primary] ?? row.ava_primary,
    city: row.address_city ?? '',
    latitude: row.latitude,
    longitude: row.longitude,
    setting: row.setting as Setting | null,
    hours: parseHours(row.hours),
    reservationType: row.reservation_type as ReservationType,
    bookingUrl: row.reservation_url || row.website_url || '',
    groupSizeMax: row.max_group_size,
    parking: mapParking(row),
    noiseLevel: (row.noise_level ?? 'moderate') as NoiseLevel,
    varietals: mapVarietals(varietalRows),
    signatureVarietals: mapSignatureVarietals(varietalRows),
    minFlightPrice: prices.length > 0 ? Math.min(...prices) : 0,
    maxFlightPrice: prices.length > 0 ? Math.max(...prices) : 0,
    flights,
    averageRating: row.rating_google,
    ratingsCount: row.review_count_total,
    isDogFriendly: row.is_dog_friendly,
    isKidFriendly: row.is_kid_friendly,
    isWheelchairAccessible: row.is_wheelchair_accessible,
    hasFoodPairing: row.has_food_pairing,
    hasOutdoorSeating: ((row as Record<string, unknown>).has_outdoor_seating as boolean) ?? false,
    hasViews: row.has_sunset_views,
    isMembersOnly: row.is_members_only,
  };
}

export function toWineryForMatching(
  row: WineryRow,
  flightRows: FlightRow[],
  varietalRows: VarietalRow[],
): WineryForMatching {
  const eligibleFlights = flightRows.filter((f) => f.price != null && f.price <= 200);
  const minPrice =
    eligibleFlights.length > 0 ? Math.min(...eligibleFlights.map((f) => f.price!)) : null;

  return {
    id: row.id,
    slug: row.slug,
    region: AVA_TO_DISPLAY[row.ava_primary] ?? row.ava_primary,
    reservationType: row.reservation_type as ReservationType,
    isMembersOnly: row.is_members_only,
    groupSizeMax: row.max_group_size,
    varietals: mapVarietals(varietalRows),
    minFlightPrice: minPrice,
    isDogFriendly: row.is_dog_friendly,
    isKidFriendly: row.is_kid_friendly,
    isWheelchairAccessible: row.is_wheelchair_accessible,
    hasFoodPairing: row.has_food_pairing,
    hasOutdoorSeating: ((row as Record<string, unknown>).has_outdoor_seating as boolean) ?? false,
    hasViews: row.has_sunset_views,
    styleScores: mapStyleScores(row),
    qualityScore: row.quality_score,
    popularityScore: row.popularity_score,
    ratingGoogle: row.rating_google,
  };
}
