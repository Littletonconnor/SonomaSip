import type { CSVRow } from './parse-csv.js';

const AVA_MAP: Record<string, string> = {
  'alexander-valley': 'alexander_valley',
  'bennett-valley': 'bennett_valley',
  carneros: 'carneros',
  'chalk-hill': 'chalk_hill',
  'dry-creek-valley': 'dry_creek_valley',
  'fort-ross-seaview': 'fort_ross_seaview',
  'green-valley': 'green_valley',
  'petaluma-gap': 'petaluma_gap',
  rockpile: 'rockpile',
  'russian-river-valley': 'russian_river_valley',
  'sonoma-coast': 'sonoma_coast',
  'sonoma-mountain': 'sonoma_mountain',
  'sonoma-valley': 'sonoma_valley',
};

const RESERVATION_MAP: Record<string, string> = {
  'walk-in-friendly': 'walk_ins_welcome',
  recommended: 'reservations_recommended',
  required: 'appointment_only',
  'members-only': 'appointment_only',
};

const NOISE_MAP: Record<string, string> = {
  quiet: 'quiet',
  moderate: 'moderate',
  loud: 'lively',
  lively: 'lively',
};

const FLIGHT_FORMAT_MAP: Record<string, string> = {
  seated: 'seated',
  standing: 'standing',
  tour: 'tour',
  outdoor: 'outdoor',
  picnic: 'picnic',
  bar: 'bar',
};

export function mapAva(value: string, warnings: string[], context: string): string | null {
  if (!value) return null;
  const mapped = AVA_MAP[value];
  if (!mapped) {
    warnings.push(`${context}: unknown AVA "${value}"`);
    return null;
  }
  return mapped;
}

export function mapReservationType(
  value: string,
  warnings: string[],
  context: string,
): { reservationType: string; isMembersOnly: boolean } {
  if (!value) {
    warnings.push(`${context}: missing reservation_required`);
    return { reservationType: 'reservations_recommended', isMembersOnly: false };
  }
  const mapped = RESERVATION_MAP[value];
  if (!mapped) {
    warnings.push(`${context}: unknown reservation_required "${value}"`);
    return { reservationType: 'reservations_recommended', isMembersOnly: false };
  }
  return {
    reservationType: mapped,
    isMembersOnly: value === 'members-only',
  };
}

export function mapNoiseLevel(value: string, warnings: string[], context: string): string | null {
  if (!value) return null;
  const mapped = NOISE_MAP[value];
  if (!mapped) {
    warnings.push(`${context}: unknown noise_level "${value}"`);
    return null;
  }
  return mapped;
}

export function mapFlightFormat(value: string, warnings: string[], context: string): string | null {
  if (!value) return null;
  const mapped = FLIGHT_FORMAT_MAP[value];
  if (!mapped) {
    warnings.push(`${context}: unknown flight_type "${value}"`);
    return null;
  }
  return mapped;
}

export function parseBool(value: string): boolean {
  return value.toUpperCase() === 'TRUE' || value === '1';
}

export function parseIntOrNull(value: string): number | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  return isNaN(n) ? null : n;
}

export function parseFloatOrNull(value: string): number | null {
  if (!value) return null;
  const n = parseFloat(value);
  return isNaN(n) ? null : n;
}

export function buildHoursJson(
  row: CSVRow,
): Record<string, { open: string; close: string } | null> {
  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ] as const;
  const hours: Record<string, { open: string; close: string } | null> = {};
  for (const day of days) {
    const open = row[`${day}_open`];
    const close = row[`${day}_close`];
    hours[day] = open && close ? { open, close } : null;
  }
  return hours;
}
