/**
 * Diff engine: turn extracted field values into content_drafts proposals.
 *
 * Compares each extracted field against the current winery row and emits
 * a DraftProposal only when the proposed value is meaningfully different
 * from what's already in the database. Low-confidence extractions are
 * dropped here so they never reach the review queue.
 */

import type { Tables } from '../database.types.js';
import type {
  ExtractedFieldName,
  ExtractedFields,
  ExtractedValue,
  WeeklyHoursExtracted,
} from './extract.js';

type WineryRow = Tables<'wineries'>;

/**
 * Minimum confidence for an extracted field to become a draft proposal.
 * Below this we assume the model is guessing and drop it silently.
 */
export const MIN_DRAFT_CONFIDENCE = 0.4;

export interface DraftProposal {
  field_name: ExtractedFieldName;
  current_value: string | null;
  proposed_value: string;
  confidence: number;
  source_quote: string | null;
}

type FieldKind = 'string' | 'number' | 'boolean' | 'hours' | 'url' | 'phone';

const FIELD_KINDS: Record<ExtractedFieldName, FieldKind> = {
  phone: 'phone',
  address_street: 'string',
  address_city: 'string',
  address_zip: 'string',
  reservation_url: 'url',
  reservation_type: 'string',
  hours: 'hours',
  max_group_size: 'number',
  tasting_duration_typical: 'number',
  is_dog_friendly: 'boolean',
  is_kid_friendly: 'boolean',
  is_wheelchair_accessible: 'boolean',
  is_members_only: 'boolean',
  has_food_pairing: 'boolean',
  has_outdoor_seating: 'boolean',
  has_sunset_views: 'boolean',
  has_picnic_area: 'boolean',
  has_restaurant: 'boolean',
  has_live_music: 'boolean',
  has_cave_tour: 'boolean',
  has_barrel_tasting: 'boolean',
  has_vineyard_walk: 'boolean',
  private_tasting_available: 'boolean',
};

function normalizeString(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeUrl(value: string): string {
  return value.trim().toLowerCase().replace(/\/+$/, '');
}

function normalizePhone(value: string): string {
  return value.replace(/\D+/g, '');
}

function canonicalizeHours(hours: unknown): string {
  if (!hours || typeof hours !== 'object') return '';
  const days: (keyof WeeklyHoursExtracted)[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];
  const source = hours as Record<string, unknown>;
  const canonical: Record<string, { open: string | null; close: string | null } | null> = {};
  for (const day of days) {
    const entry = source[day];
    if (entry === null) {
      canonical[day] = null;
      continue;
    }
    if (entry && typeof entry === 'object') {
      const e = entry as Record<string, unknown>;
      canonical[day] = {
        open: typeof e.open === 'string' ? e.open : null,
        close: typeof e.close === 'string' ? e.close : null,
      };
    }
  }
  return JSON.stringify(canonical);
}

function serializeProposed(kind: FieldKind, value: unknown): string {
  if (kind === 'hours') return canonicalizeHours(value);
  if (kind === 'boolean') return value ? 'true' : 'false';
  if (kind === 'number') return String(value);
  return String(value).trim();
}

function serializeCurrent(kind: FieldKind, value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (kind === 'hours') {
    const canonical = canonicalizeHours(value);
    return canonical === '{}' ? null : canonical;
  }
  if (kind === 'boolean') return value ? 'true' : 'false';
  if (kind === 'number') return String(value);
  const str = String(value).trim();
  return str.length === 0 ? null : str;
}

function valuesEqual(kind: FieldKind, proposed: string, current: string | null): boolean {
  if (current === null) return false;
  switch (kind) {
    case 'hours':
      return proposed === current;
    case 'boolean':
    case 'number':
      return proposed === current;
    case 'url':
      return normalizeUrl(proposed) === normalizeUrl(current);
    case 'phone':
      return normalizePhone(proposed) === normalizePhone(current);
    case 'string':
    default:
      return normalizeString(proposed) === normalizeString(current);
  }
}

function extractedValueHasValue<T>(
  entry: ExtractedValue<T> | undefined,
): entry is ExtractedValue<T> & { value: T } {
  return !!entry && entry.value !== null && entry.value !== undefined;
}

/**
 * Compare a freshly extracted field set against the current winery row
 * and return draft proposals for every meaningful change. Fields that
 * match the DB, fall below confidence, or have no value are skipped.
 */
export function buildDrafts(extracted: ExtractedFields, current: WineryRow): DraftProposal[] {
  const drafts: DraftProposal[] = [];
  const row = current as unknown as Record<string, unknown>;

  for (const field of Object.keys(FIELD_KINDS) as ExtractedFieldName[]) {
    const entry = extracted[field] as ExtractedValue<unknown> | undefined;
    if (!extractedValueHasValue(entry)) continue;
    if (entry.confidence < MIN_DRAFT_CONFIDENCE) continue;

    const kind = FIELD_KINDS[field];
    const proposed = serializeProposed(kind, entry.value);
    if (proposed.length === 0) continue;

    const currentSerialized = serializeCurrent(kind, row[field]);
    if (valuesEqual(kind, proposed, currentSerialized)) continue;

    drafts.push({
      field_name: field,
      current_value: currentSerialized,
      proposed_value: proposed,
      confidence: Number(entry.confidence.toFixed(2)),
      source_quote: entry.source_quote,
    });
  }

  return drafts;
}
