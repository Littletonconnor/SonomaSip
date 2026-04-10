/**
 * LLM enrichment of editorial winery content via Claude Sonnet.
 *
 * Takes extracted factual fields plus scraped markdown and asks Claude Sonnet
 * to generate editorial fields: tagline, description, insider tip, best-for
 * tags, style scores (1-5), and editorial judgments (hidden gem, must-visit,
 * local favorite, quality/popularity scores). Each field is returned with a
 * reasoning string and a confidence score so reviewers can weigh trust.
 *
 * Only factual, content-supported claims are generated — the voice is warm,
 * specific, and concrete, never generic marketing copy. The model is told to
 * omit fields rather than fabricate them.
 *
 * Requires ANTHROPIC_API_KEY at runtime.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Tables } from '../database.types.js';
import type { CrawlPage } from './crawl.js';
import type { ExtractedFields, ExtractedValue } from './extract.js';

export const ENRICHMENT_MODEL = 'claude-sonnet-4-6';

/**
 * Bump when the EnrichedFields shape or the tool schema changes so downstream
 * consumers can detect and handle older enrichment rows.
 */
export const ENRICHMENT_SCHEMA_VERSION = 1;

/** Enrichment content older than this is considered stale and re-generated. */
export const STALE_CONTENT_DAYS = 90;

/** Minimum confidence for an enrichment field to become a draft proposal. */
export const MIN_ENRICHMENT_CONFIDENCE = 0.5;

const MAX_CHARS_PER_PAGE = 8_000;
const MAX_TOTAL_CHARS = 32_000;
const MAX_OUTPUT_TOKENS = 4_096;

const STYLE_FIELDS = [
  'style_classic',
  'style_luxury',
  'style_family_friendly',
  'style_social',
  'style_sustainable',
  'style_adventure',
] as const;

const EDITORIAL_JUDGMENT_FIELDS = [
  'is_hidden_gem',
  'is_must_visit',
  'is_local_favorite',
  'quality_score',
  'popularity_score',
] as const;

const EDITORIAL_CONTENT_FIELDS = [
  'tagline',
  'description',
  'unique_selling_point',
  'best_for',
] as const;

export const ENRICHMENT_FIELD_NAMES = [
  ...EDITORIAL_CONTENT_FIELDS,
  ...STYLE_FIELDS,
  ...EDITORIAL_JUDGMENT_FIELDS,
] as const;

export type EnrichedFieldName = (typeof ENRICHMENT_FIELD_NAMES)[number];

export interface EnrichedValue<T> {
  value: T | null;
  reasoning: string | null;
  confidence: number;
}

export interface EnrichedFields {
  tagline?: EnrichedValue<string>;
  description?: EnrichedValue<string>;
  unique_selling_point?: EnrichedValue<string>;
  best_for?: EnrichedValue<string>;
  style_classic?: EnrichedValue<number>;
  style_luxury?: EnrichedValue<number>;
  style_family_friendly?: EnrichedValue<number>;
  style_social?: EnrichedValue<number>;
  style_sustainable?: EnrichedValue<number>;
  style_adventure?: EnrichedValue<number>;
  is_hidden_gem?: EnrichedValue<boolean>;
  is_must_visit?: EnrichedValue<boolean>;
  is_local_favorite?: EnrichedValue<boolean>;
  quality_score?: EnrichedValue<number>;
  popularity_score?: EnrichedValue<number>;
}

export interface EnrichmentSource {
  url: string;
  title: string | null;
}

export interface EnrichmentResult {
  fields: EnrichedFields;
  model: string;
  schemaVersion: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  sources: EnrichmentSource[];
}

export interface EnrichmentDraftProposal {
  field_name: EnrichedFieldName;
  current_value: string | null;
  proposed_value: string;
  confidence: number;
  source_quote: string | null;
}

type FieldKind = 'string' | 'tagList' | 'boolean' | 'styleScore' | 'rating10';

const FIELD_KINDS: Record<EnrichedFieldName, FieldKind> = {
  tagline: 'string',
  description: 'string',
  unique_selling_point: 'string',
  best_for: 'tagList',
  style_classic: 'styleScore',
  style_luxury: 'styleScore',
  style_family_friendly: 'styleScore',
  style_social: 'styleScore',
  style_sustainable: 'styleScore',
  style_adventure: 'styleScore',
  is_hidden_gem: 'boolean',
  is_must_visit: 'boolean',
  is_local_favorite: 'boolean',
  quality_score: 'rating10',
  popularity_score: 'rating10',
};

const SYSTEM_PROMPT = `You are a wine country editor writing concise editorial content for the Sonoma Sip winery guide.

Voice guidelines:
- Warm, knowledgeable, and specific. Avoid generic marketing phrases like "best winery", "amazing experience", "world-class".
- Concrete over abstract. Prefer "known for their single-vineyard Pinot Noir from the Russian River" to "excellent wines".
- Never fabricate facts. Only state things directly supported by the provided content. If uncertain, lower the confidence.
- Accessible, not pretentious. Write like a well-traveled friend recommending a stop.

For every field you return, use the shape { value, reasoning, confidence }:
- value: the generated content, or null if you have no support for it.
- reasoning: 1-2 sentences explaining your call and citing the specific details from the content you relied on.
- confidence: 0.0-1.0. 1.0 = strongly supported by explicit content; 0.7 = reasonably inferred; 0.5 = plausible but thin. Omit the field entirely rather than returning a value below 0.5.

Field specifications:
- tagline: ≤15 words. A distinctive one-line hook — not a slogan.
- description: 2-3 sentences. What makes this winery worth visiting and what to expect on a visit.
- unique_selling_point: one insider tip — a specific detail a regular would mention (a view, a booking trick, a signature pour, a tour quirk). 1-2 sentences.
- best_for: comma-separated list of 3-5 short tags (e.g., "couples, sunset views, pinot lovers"). Lowercase. Prefer specific over generic.
- style_classic, style_luxury, style_family_friendly, style_social, style_sustainable, style_adventure: integer 1-5 (1 = not at all, 3 = moderate, 5 = definitive). Base the number on concrete evidence from the content.
- is_hidden_gem: true only if the winery is notably under-the-radar (small production, appointment-only, off the beaten path) AND there are signals of quality.
- is_must_visit: true only if there is strong evidence of critical acclaim or a landmark experience.
- is_local_favorite: true only if the content supports a locals-vs-tourists framing.
- quality_score: integer 1-10. 1-3 = limited offering, 4-6 = solid, 7-8 = notable, 9-10 = destination-caliber. Require evidence (awards, reviews, signature varietals, reputation signals).
- popularity_score: integer 1-10. 1-3 = obscure, 4-6 = known locally, 7-8 = regional draw, 9-10 = widely recognized.

If a field cannot be supported by the content, omit it from the output entirely. Do not emit placeholder nulls with non-zero confidence.`;

function enrichedValueSchema(valueSchema: Record<string, unknown>): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      value: valueSchema,
      reasoning: { type: ['string', 'null'], maxLength: 600 },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
    },
    required: ['value', 'reasoning', 'confidence'],
    additionalProperties: false,
  };
}

const stringValueSchema = enrichedValueSchema({ type: ['string', 'null'], maxLength: 500 });
const styleScoreSchema = enrichedValueSchema({
  type: ['integer', 'null'],
  minimum: 1,
  maximum: 5,
});
const rating10Schema = enrichedValueSchema({
  type: ['integer', 'null'],
  minimum: 1,
  maximum: 10,
});
const booleanValueSchema = enrichedValueSchema({ type: ['boolean', 'null'] });

const ENRICHMENT_TOOL = {
  name: 'generate_winery_editorial',
  description:
    'Generate editorial content and scores for a winery based on scraped content. Omit any field you cannot support from the provided content.',
  input_schema: {
    type: 'object',
    properties: {
      tagline: stringValueSchema,
      description: stringValueSchema,
      unique_selling_point: stringValueSchema,
      best_for: stringValueSchema,
      style_classic: styleScoreSchema,
      style_luxury: styleScoreSchema,
      style_family_friendly: styleScoreSchema,
      style_social: styleScoreSchema,
      style_sustainable: styleScoreSchema,
      style_adventure: styleScoreSchema,
      is_hidden_gem: booleanValueSchema,
      is_must_visit: booleanValueSchema,
      is_local_favorite: booleanValueSchema,
      quality_score: rating10Schema,
      popularity_score: rating10Schema,
    },
    additionalProperties: false,
  },
} as const;

export type EnrichmentContext = Pick<
  Tables<'wineries'>,
  | 'name'
  | 'ava_primary'
  | 'ava_secondary'
  | 'nearest_town'
  | 'signature_wines'
  | 'ownership_type'
  | 'winery_scale'
  | 'tasting_room_vibe'
  | 'production_size'
  | 'annual_cases'
>;

function formatExtractedFacts(extracted: ExtractedFields): string {
  const lines: string[] = [];
  for (const [field, entry] of Object.entries(extracted) as Array<
    [string, ExtractedValue<unknown> | undefined]
  >) {
    if (!entry || entry.value === null || entry.value === undefined) continue;
    if (typeof entry.confidence === 'number' && entry.confidence < 0.5) continue;
    const rendered =
      typeof entry.value === 'object' ? JSON.stringify(entry.value) : String(entry.value);
    lines.push(`- ${field}: ${rendered}`);
  }
  return lines.join('\n');
}

function truncatePage(page: CrawlPage): string {
  const markdown =
    page.markdown.length > MAX_CHARS_PER_PAGE
      ? `${page.markdown.slice(0, MAX_CHARS_PER_PAGE)}\n…[truncated]…`
      : page.markdown;
  const header = page.title ? `## ${page.title} (${page.url})` : `## ${page.url}`;
  return `${header}\n\n${markdown}`;
}

function buildContent(
  winery: EnrichmentContext,
  extracted: ExtractedFields,
  pages: CrawlPage[],
): string {
  const contextLines = [
    `# ${winery.name}`,
    `Primary AVA: ${winery.ava_primary}`,
    winery.ava_secondary ? `Secondary AVA: ${winery.ava_secondary}` : null,
    winery.nearest_town ? `Nearest town: ${winery.nearest_town}` : null,
    winery.production_size ? `Production size: ${winery.production_size}` : null,
    winery.annual_cases ? `Annual cases: ${winery.annual_cases}` : null,
    winery.winery_scale ? `Scale: ${winery.winery_scale}` : null,
    winery.tasting_room_vibe ? `Tasting room vibe: ${winery.tasting_room_vibe}` : null,
    winery.ownership_type ? `Ownership: ${winery.ownership_type}` : null,
    winery.signature_wines ? `Signature wines (editorial): ${winery.signature_wines}` : null,
  ].filter((line): line is string => line !== null);

  const factBlock = formatExtractedFacts(extracted);

  const sections: string[] = [];
  let budget = MAX_TOTAL_CHARS;
  for (const page of pages) {
    const section = truncatePage(page);
    if (budget - section.length < 0) {
      sections.push(section.slice(0, Math.max(0, budget)));
      break;
    }
    sections.push(section);
    budget -= section.length;
  }

  return [
    contextLines.join('\n'),
    '',
    '## Facts extracted from the website',
    factBlock || '(none available)',
    '',
    '## Scraped content pages',
    sections.join('\n\n---\n\n'),
  ].join('\n');
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required for enrichment');
  }
  return new Anthropic({ apiKey });
}

function coerceEnrichedFields(raw: unknown): EnrichedFields {
  if (!raw || typeof raw !== 'object') return {};
  const fields: EnrichedFields = {};
  const source = raw as Record<string, unknown>;

  for (const field of ENRICHMENT_FIELD_NAMES) {
    const entry = source[field];
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;

    const value = e.value ?? null;
    const confidenceRaw = typeof e.confidence === 'number' ? e.confidence : 0;
    const confidence = Math.max(0, Math.min(1, confidenceRaw));
    const reasoning =
      typeof e.reasoning === 'string' && e.reasoning.trim().length > 0 ? e.reasoning.trim() : null;

    if (value === null && confidence === 0 && !reasoning) continue;

    (fields as Record<string, unknown>)[field] = { value, reasoning, confidence };
  }

  return fields;
}

/**
 * Send extracted facts + raw crawled pages to Claude Sonnet and receive
 * editorial content for the winery. Throws if the API call fails or the
 * model does not return the expected tool call. Callers handle errors
 * per-winery.
 */
export async function enrichWineryContent(
  winery: EnrichmentContext,
  extracted: ExtractedFields,
  pages: CrawlPage[],
): Promise<EnrichmentResult> {
  if (pages.length === 0) {
    throw new Error('enrichWineryContent requires at least one scraped page');
  }

  const client = getClient();
  const content = buildContent(winery, extracted, pages);

  const response = await client.messages.create({
    model: ENRICHMENT_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM_PROMPT,
    tools: [ENRICHMENT_TOOL],
    tool_choice: { type: 'tool', name: ENRICHMENT_TOOL.name },
    messages: [{ role: 'user', content }],
  });

  const toolBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === 'tool_use' && block.name === ENRICHMENT_TOOL.name,
  );

  if (!toolBlock) {
    throw new Error('Claude did not return a generate_winery_editorial tool call');
  }

  const fields = coerceEnrichedFields(toolBlock.input);

  return {
    fields,
    model: response.model,
    schemaVersion: ENRICHMENT_SCHEMA_VERSION,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    sources: pages.map((p) => ({ url: p.url, title: p.title })),
  };
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function serializeProposed(kind: FieldKind, value: unknown): string {
  switch (kind) {
    case 'boolean':
      return value ? 'true' : 'false';
    case 'styleScore':
      return String(clampInt(Number(value), 1, 5));
    case 'rating10':
      return String(clampInt(Number(value), 1, 10));
    case 'tagList': {
      const parts = String(value)
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0);
      return parts.join(', ');
    }
    case 'string':
    default:
      return String(value).trim().replace(/\s+/g, ' ');
  }
}

function serializeCurrent(kind: FieldKind, value: unknown): string | null {
  if (value === null || value === undefined) return null;
  switch (kind) {
    case 'boolean':
      return value ? 'true' : 'false';
    case 'styleScore':
    case 'rating10':
      return String(value);
    case 'tagList': {
      const parts = String(value)
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0);
      return parts.length === 0 ? null : parts.join(', ');
    }
    case 'string':
    default: {
      const str = String(value).trim().replace(/\s+/g, ' ');
      return str.length === 0 ? null : str;
    }
  }
}

function valuesEqual(kind: FieldKind, proposed: string, current: string | null): boolean {
  if (current === null) return false;
  if (kind === 'string' || kind === 'tagList') {
    return proposed.toLowerCase() === current.toLowerCase();
  }
  return proposed === current;
}

/**
 * Compare a freshly generated editorial field set against the current winery
 * row and return draft proposals for every meaningful change. Drops anything
 * below MIN_ENRICHMENT_CONFIDENCE or whose proposed value is empty or matches
 * the DB value.
 */
export function buildEnrichmentDrafts(
  enriched: EnrichedFields,
  current: Tables<'wineries'>,
): EnrichmentDraftProposal[] {
  const drafts: EnrichmentDraftProposal[] = [];
  const row = current as unknown as Record<string, unknown>;

  for (const field of ENRICHMENT_FIELD_NAMES) {
    const entry = enriched[field] as EnrichedValue<unknown> | undefined;
    if (!entry || entry.value === null || entry.value === undefined) continue;
    if (typeof entry.confidence !== 'number' || entry.confidence < MIN_ENRICHMENT_CONFIDENCE) {
      continue;
    }

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
      source_quote: entry.reasoning,
    });
  }

  return drafts;
}
