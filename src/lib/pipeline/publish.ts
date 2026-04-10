/**
 * Publish engine: classify content_drafts, parse proposed values back into
 * their column types, and produce atomic winery update patches.
 *
 * Pure functions only — database I/O lives in `scripts/publish-wineries.ts`.
 * This module is the single source of truth for:
 *   - which fields can be auto-approved vs. flagged for human review
 *   - how a text-serialized proposed_value is deserialized into the shape
 *     expected by the `wineries` table
 *   - which coverage_tier transitions a publish run implies
 */

import type { Tables } from '../database.types.js';
import type { DraftProposal } from './diff.js';
import type { EnrichmentDraftProposal } from './enrich.js';

type WineryRow = Tables<'wineries'>;

/**
 * Category of a draft field. Drives auto-approve rules and review-queue
 * grouping in the admin UI.
 */
export type DraftCategory =
  | 'factual'
  | 'experience_flag'
  | 'editorial'
  | 'style_score'
  | 'editorial_judgment';

/** Storage shape of the underlying `wineries` column. */
export type DraftFieldType = 'text' | 'boolean' | 'integer' | 'hours_json';

export interface DraftFieldSpec {
  category: DraftCategory;
  type: DraftFieldType;
  /**
   * Whether the column participates in match scoring. Fields that do are
   * never auto-approved — the matching engine's behavior depends on them,
   * so every change needs a human in the loop.
   */
  affectsMatching: boolean;
}

/**
 * Registry of every field name the pipeline is allowed to write through a
 * draft. Any field_name not in this map is treated as unknown and rejected
 * by the publisher.
 */
export const DRAFT_FIELDS = {
  // Factual facts pulled out of winery websites by the extraction stage.
  phone: { category: 'factual', type: 'text', affectsMatching: false },
  address_street: { category: 'factual', type: 'text', affectsMatching: false },
  address_city: { category: 'factual', type: 'text', affectsMatching: false },
  address_zip: { category: 'factual', type: 'text', affectsMatching: false },
  reservation_url: { category: 'factual', type: 'text', affectsMatching: false },
  reservation_type: { category: 'factual', type: 'text', affectsMatching: true },
  hours: { category: 'factual', type: 'hours_json', affectsMatching: false },
  max_group_size: { category: 'factual', type: 'integer', affectsMatching: false },
  tasting_duration_typical: { category: 'factual', type: 'integer', affectsMatching: false },

  // Experience flags directly feed the matching filters — always reviewed.
  is_dog_friendly: { category: 'experience_flag', type: 'boolean', affectsMatching: true },
  is_kid_friendly: { category: 'experience_flag', type: 'boolean', affectsMatching: true },
  is_wheelchair_accessible: {
    category: 'experience_flag',
    type: 'boolean',
    affectsMatching: true,
  },
  is_members_only: { category: 'experience_flag', type: 'boolean', affectsMatching: true },
  has_food_pairing: { category: 'experience_flag', type: 'boolean', affectsMatching: true },
  has_outdoor_seating: { category: 'experience_flag', type: 'boolean', affectsMatching: true },
  has_sunset_views: { category: 'experience_flag', type: 'boolean', affectsMatching: true },
  has_picnic_area: { category: 'experience_flag', type: 'boolean', affectsMatching: true },
  has_restaurant: { category: 'experience_flag', type: 'boolean', affectsMatching: true },
  has_live_music: { category: 'experience_flag', type: 'boolean', affectsMatching: false },
  has_cave_tour: { category: 'experience_flag', type: 'boolean', affectsMatching: false },
  has_barrel_tasting: { category: 'experience_flag', type: 'boolean', affectsMatching: false },
  has_vineyard_walk: { category: 'experience_flag', type: 'boolean', affectsMatching: false },
  private_tasting_available: {
    category: 'experience_flag',
    type: 'boolean',
    affectsMatching: false,
  },

  // Editorial content produced by the enrichment stage.
  tagline: { category: 'editorial', type: 'text', affectsMatching: false },
  description: { category: 'editorial', type: 'text', affectsMatching: false },
  unique_selling_point: { category: 'editorial', type: 'text', affectsMatching: false },
  best_for: { category: 'editorial', type: 'text', affectsMatching: false },

  // Style scores feed the scoring formula — always reviewed.
  style_classic: { category: 'style_score', type: 'integer', affectsMatching: true },
  style_luxury: { category: 'style_score', type: 'integer', affectsMatching: true },
  style_family_friendly: { category: 'style_score', type: 'integer', affectsMatching: true },
  style_social: { category: 'style_score', type: 'integer', affectsMatching: true },
  style_sustainable: { category: 'style_score', type: 'integer', affectsMatching: true },
  style_adventure: { category: 'style_score', type: 'integer', affectsMatching: true },

  // Editorial judgments — subjective, always reviewed.
  is_hidden_gem: { category: 'editorial_judgment', type: 'boolean', affectsMatching: false },
  is_must_visit: { category: 'editorial_judgment', type: 'boolean', affectsMatching: false },
  is_local_favorite: { category: 'editorial_judgment', type: 'boolean', affectsMatching: false },
  quality_score: { category: 'editorial_judgment', type: 'integer', affectsMatching: false },
  popularity_score: { category: 'editorial_judgment', type: 'integer', affectsMatching: false },
} as const satisfies Record<string, DraftFieldSpec>;

export type PublishableFieldName = keyof typeof DRAFT_FIELDS;

/** Confidence threshold for "factual, high-confidence" auto-approval. */
export const AUTO_APPROVE_HIGH_CONFIDENCE = 0.9;

/**
 * Confidence threshold for auto-approving an addition (a factual field where
 * the current column value is null). Looser than the high-confidence rule
 * because there is no existing value to clobber.
 */
export const AUTO_APPROVE_ADDITION_CONFIDENCE = 0.7;

export type AutoApproveReason =
  | 'factual_high_confidence'
  | 'factual_addition'
  | 'unknown_field'
  | 'affects_matching'
  | 'editorial_content'
  | 'editorial_judgment'
  | 'style_score'
  | 'experience_flag'
  | 'low_confidence';

export interface AutoApproveDecision {
  auto: boolean;
  reason: AutoApproveReason;
}

/**
 * Minimal draft shape needed to classify it. Matches the `content_drafts`
 * row columns that matter for the rules.
 */
export interface DraftLike {
  field_name: string;
  current_value: string | null;
  confidence: number | null;
}

/**
 * Decide whether a pending draft can be auto-approved or needs a human.
 *
 * Auto-approve rules (from `docs/PRD.md` phase P6):
 *   1. Factual field AND confidence >= AUTO_APPROVE_HIGH_CONFIDENCE
 *   2. Factual field AND current_value is null (addition)
 *      AND confidence >= AUTO_APPROVE_ADDITION_CONFIDENCE
 *
 * Everything else flips to human review:
 *   - editorial content, style scores, editorial judgments, experience flags
 *   - factual fields that feed match scoring (e.g. reservation_type)
 *   - unknown fields
 *   - low-confidence factual proposals
 *
 * Categories are checked before `affectsMatching` so the category-specific
 * reason survives — a style_score change reports `style_score`, not the
 * broader `affects_matching`.
 */
export function classifyDraft(draft: DraftLike): AutoApproveDecision {
  const spec = DRAFT_FIELDS[draft.field_name as PublishableFieldName];
  if (!spec) return { auto: false, reason: 'unknown_field' };

  switch (spec.category) {
    case 'editorial':
      return { auto: false, reason: 'editorial_content' };
    case 'editorial_judgment':
      return { auto: false, reason: 'editorial_judgment' };
    case 'style_score':
      return { auto: false, reason: 'style_score' };
    case 'experience_flag':
      return { auto: false, reason: 'experience_flag' };
    case 'factual':
      break;
  }

  if (spec.affectsMatching) {
    return { auto: false, reason: 'affects_matching' };
  }

  const confidence = draft.confidence ?? 0;
  if (confidence >= AUTO_APPROVE_HIGH_CONFIDENCE) {
    return { auto: true, reason: 'factual_high_confidence' };
  }
  if (draft.current_value === null && confidence >= AUTO_APPROVE_ADDITION_CONFIDENCE) {
    return { auto: true, reason: 'factual_addition' };
  }
  return { auto: false, reason: 'low_confidence' };
}

/**
 * Parse the text-serialized proposed_value back into the shape expected by
 * the `wineries` column. Throws on unknown fields or malformed values — the
 * publisher should treat a parse error as a hard failure for that draft.
 */
export function parseProposedValue(fieldName: string, proposedValue: string): unknown {
  const spec = DRAFT_FIELDS[fieldName as PublishableFieldName];
  if (!spec) {
    throw new Error(`Unknown publish field: ${fieldName}`);
  }

  switch (spec.type) {
    case 'boolean': {
      if (proposedValue === 'true') return true;
      if (proposedValue === 'false') return false;
      throw new Error(`Invalid boolean for ${fieldName}: ${proposedValue}`);
    }
    case 'integer': {
      const trimmed = proposedValue.trim();
      if (!/^-?\d+$/.test(trimmed)) {
        throw new Error(`Invalid integer for ${fieldName}: ${proposedValue}`);
      }
      return parseInt(trimmed, 10);
    }
    case 'hours_json': {
      try {
        const parsed = JSON.parse(proposedValue);
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('not an object');
        }
        return parsed;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Invalid hours JSON for ${fieldName}: ${msg}`);
      }
    }
    case 'text':
    default:
      return proposedValue;
  }
}

/** Does the publisher know how to write this field? */
export function isPublishableField(fieldName: string): fieldName is PublishableFieldName {
  return fieldName in DRAFT_FIELDS;
}

export interface PatchableDraft {
  field_name: string;
  proposed_value: string;
}

/**
 * Build an atomic patch for a single winery from its approved + auto-approved
 * drafts. Throws if any draft fails to parse — callers should either skip
 * that winery entirely or surface the error.
 */
export function buildWineryPatch(drafts: PatchableDraft[]): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const d of drafts) {
    if (!isPublishableField(d.field_name)) {
      throw new Error(`Unknown publish field: ${d.field_name}`);
    }
    patch[d.field_name] = parseProposedValue(d.field_name, d.proposed_value);
  }
  return patch;
}

/**
 * Compute the next coverage tier after a publish. A discovered winery that
 * successfully receives its first round of published changes is promoted to
 * verified; every other tier stays put.
 */
export function nextCoverageTier(current: WineryRow['coverage_tier']): WineryRow['coverage_tier'] {
  return current === 'discovered' ? 'verified' : current;
}

/**
 * Convenience: any DraftProposal or EnrichmentDraftProposal coming out of
 * the diff/enrich stages already satisfies DraftLike. Exposed so scripts
 * can classify in-memory proposals without a round trip through the DB.
 */
export function classifyProposal(
  proposal: DraftProposal | EnrichmentDraftProposal,
): AutoApproveDecision {
  return classifyDraft({
    field_name: proposal.field_name,
    current_value: proposal.current_value,
    confidence: proposal.confidence,
  });
}
