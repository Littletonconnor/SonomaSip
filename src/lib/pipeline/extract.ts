/**
 * LLM extraction of structured winery data from scraped markdown.
 *
 * Takes the pages produced by the crawl stage and asks Claude Haiku to
 * return a fixed JSON shape via tool-use. Each field comes back as
 * `{ value, confidence, source_quote }` so the diff engine and human
 * reviewers can weigh trust before publishing.
 *
 * Requires ANTHROPIC_API_KEY at runtime.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { CrawlPage } from './crawl.js';

export const EXTRACTION_MODEL = 'claude-haiku-4-5';

/**
 * Bump when the ExtractedFields shape or the tool schema changes so
 * downstream consumers can detect and handle older extraction rows.
 */
export const EXTRACTION_SCHEMA_VERSION = 1;

const MAX_CHARS_PER_PAGE = 10_000;
const MAX_TOTAL_CHARS = 40_000;
const MAX_OUTPUT_TOKENS = 4_096;

const RESERVATION_TYPES = [
  'walk_ins_welcome',
  'reservations_recommended',
  'appointment_only',
] as const;
export type ReservationTypeValue = (typeof RESERVATION_TYPES)[number];

export interface ExtractedValue<T> {
  value: T | null;
  confidence: number;
  source_quote: string | null;
}

export interface DayHoursExtracted {
  open: string | null;
  close: string | null;
}

export type WeeklyHoursExtracted = Partial<
  Record<
    'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
    DayHoursExtracted | null
  >
>;

export interface ExtractedFields {
  phone?: ExtractedValue<string>;
  address_street?: ExtractedValue<string>;
  address_city?: ExtractedValue<string>;
  address_zip?: ExtractedValue<string>;
  reservation_url?: ExtractedValue<string>;
  reservation_type?: ExtractedValue<ReservationTypeValue>;
  hours?: ExtractedValue<WeeklyHoursExtracted>;
  max_group_size?: ExtractedValue<number>;
  tasting_duration_typical?: ExtractedValue<number>;
  is_dog_friendly?: ExtractedValue<boolean>;
  is_kid_friendly?: ExtractedValue<boolean>;
  is_wheelchair_accessible?: ExtractedValue<boolean>;
  is_members_only?: ExtractedValue<boolean>;
  has_food_pairing?: ExtractedValue<boolean>;
  has_outdoor_seating?: ExtractedValue<boolean>;
  has_sunset_views?: ExtractedValue<boolean>;
  has_picnic_area?: ExtractedValue<boolean>;
  has_restaurant?: ExtractedValue<boolean>;
  has_live_music?: ExtractedValue<boolean>;
  has_cave_tour?: ExtractedValue<boolean>;
  has_barrel_tasting?: ExtractedValue<boolean>;
  has_vineyard_walk?: ExtractedValue<boolean>;
  private_tasting_available?: ExtractedValue<boolean>;
}

export type ExtractedFieldName = keyof ExtractedFields;

export interface ExtractionResult {
  fields: ExtractedFields;
  model: string;
  schemaVersion: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

const SYSTEM_PROMPT = `You extract factual winery data from scraped website content.

Rules:
- Only extract facts that are explicitly stated or directly inferable from the content. Never guess.
- For each field, return an object { value, confidence, source_quote }.
  - value: the extracted value, or null if not found.
  - confidence: 1.0 = explicitly stated in the content, 0.5 = reasonably inferred, 0.0 = not found.
  - source_quote: a short verbatim quote (≤200 chars) from the content that supports the value, or null if not found.
- If you cannot find a field, omit it from the output entirely. Do not emit placeholder nulls.
- Do not fabricate source quotes. Only use text that literally appears in the provided content.
- Hours: use 24-hour "HH:MM" format. If closed on a day, set that day to null. Only include days you can verify.
- Reservation type: use "walk_ins_welcome" if walk-ins are explicitly welcomed; "appointment_only" if visits require advance reservations with no walk-ins; "reservations_recommended" otherwise (default for "reservations encouraged/suggested").
- Amenity booleans: only set true/false when explicitly stated. If the website does not mention dog policy at all, omit the field rather than guessing false.`;

function buildExtractedValueSchema(valueSchema: Record<string, unknown>): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      value: valueSchema,
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      source_quote: { type: ['string', 'null'], maxLength: 400 },
    },
    required: ['value', 'confidence', 'source_quote'],
    additionalProperties: false,
  };
}

const stringValue = buildExtractedValueSchema({ type: ['string', 'null'] });
const numberValue = buildExtractedValueSchema({ type: ['number', 'null'] });
const booleanValue = buildExtractedValueSchema({ type: ['boolean', 'null'] });
const reservationTypeValue = buildExtractedValueSchema({
  type: ['string', 'null'],
  enum: [...RESERVATION_TYPES, null],
});

const dayHoursSchema = {
  oneOf: [
    {
      type: 'object',
      properties: {
        open: { type: ['string', 'null'] },
        close: { type: ['string', 'null'] },
      },
      required: ['open', 'close'],
      additionalProperties: false,
    },
    { type: 'null' },
  ],
};

const hoursValue = buildExtractedValueSchema({
  oneOf: [
    {
      type: 'object',
      properties: {
        monday: dayHoursSchema,
        tuesday: dayHoursSchema,
        wednesday: dayHoursSchema,
        thursday: dayHoursSchema,
        friday: dayHoursSchema,
        saturday: dayHoursSchema,
        sunday: dayHoursSchema,
      },
      additionalProperties: false,
    },
    { type: 'null' },
  ],
});

const EXTRACTION_TOOL = {
  name: 'extract_winery_fields',
  description:
    'Record structured winery facts found in the scraped website content. Omit any field that is not supported by the content.',
  input_schema: {
    type: 'object',
    properties: {
      phone: stringValue,
      address_street: stringValue,
      address_city: stringValue,
      address_zip: stringValue,
      reservation_url: stringValue,
      reservation_type: reservationTypeValue,
      hours: hoursValue,
      max_group_size: numberValue,
      tasting_duration_typical: numberValue,
      is_dog_friendly: booleanValue,
      is_kid_friendly: booleanValue,
      is_wheelchair_accessible: booleanValue,
      is_members_only: booleanValue,
      has_food_pairing: booleanValue,
      has_outdoor_seating: booleanValue,
      has_sunset_views: booleanValue,
      has_picnic_area: booleanValue,
      has_restaurant: booleanValue,
      has_live_music: booleanValue,
      has_cave_tour: booleanValue,
      has_barrel_tasting: booleanValue,
      has_vineyard_walk: booleanValue,
      private_tasting_available: booleanValue,
    },
    additionalProperties: false,
  },
} as const;

export const EXTRACTABLE_FIELDS = Object.keys(
  EXTRACTION_TOOL.input_schema.properties,
) as ExtractedFieldName[];

function truncatePage(page: CrawlPage): string {
  const markdown =
    page.markdown.length > MAX_CHARS_PER_PAGE
      ? `${page.markdown.slice(0, MAX_CHARS_PER_PAGE)}\n…[truncated]…`
      : page.markdown;
  const header = page.title ? `## ${page.title} (${page.url})` : `## ${page.url}`;
  return `${header}\n\n${markdown}`;
}

function buildContent(wineryName: string, pages: CrawlPage[]): string {
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

  return `Winery: ${wineryName}

Below are pages scraped from the winery's website. Extract the structured fields defined in the tool.

${sections.join('\n\n---\n\n')}`;
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required for extraction');
  }
  return new Anthropic({ apiKey });
}

function coerceExtractedFields(raw: unknown): ExtractedFields {
  if (!raw || typeof raw !== 'object') return {};
  const fields: ExtractedFields = {};
  const source = raw as Record<string, unknown>;

  for (const field of EXTRACTABLE_FIELDS) {
    const entry = source[field];
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;

    const value = e.value ?? null;
    const confidenceRaw = typeof e.confidence === 'number' ? e.confidence : 0;
    const confidence = Math.max(0, Math.min(1, confidenceRaw));
    const source_quote =
      typeof e.source_quote === 'string' && e.source_quote.length > 0 ? e.source_quote : null;

    if (value === null && confidence === 0 && !source_quote) continue;

    (fields as Record<string, unknown>)[field] = { value, confidence, source_quote };
  }

  return fields;
}

/**
 * Extract structured fields from a winery's scraped pages via Claude Haiku
 * tool-use. Throws if the API call fails or the model does not return the
 * expected tool call; callers should handle errors per-winery.
 */
export async function extractWineryData(
  wineryName: string,
  pages: CrawlPage[],
): Promise<ExtractionResult> {
  if (pages.length === 0) {
    throw new Error('extractWineryData requires at least one scraped page');
  }

  const client = getClient();
  const content = buildContent(wineryName, pages);

  const response = await client.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM_PROMPT,
    tools: [EXTRACTION_TOOL],
    tool_choice: { type: 'tool', name: EXTRACTION_TOOL.name },
    messages: [{ role: 'user', content }],
  });

  const toolBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === 'tool_use' && block.name === EXTRACTION_TOOL.name,
  );

  if (!toolBlock) {
    throw new Error('Claude did not return an extract_winery_fields tool call');
  }

  const fields = coerceExtractedFields(toolBlock.input);

  return {
    fields,
    model: response.model,
    schemaVersion: EXTRACTION_SCHEMA_VERSION,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    totalTokens: response.usage.input_tokens + response.usage.output_tokens,
  };
}
