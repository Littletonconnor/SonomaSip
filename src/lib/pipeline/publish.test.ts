import { describe, expect, it } from 'vitest';
import {
  AUTO_APPROVE_ADDITION_CONFIDENCE,
  AUTO_APPROVE_HIGH_CONFIDENCE,
  buildWineryPatch,
  classifyDraft,
  isPublishableField,
  nextCoverageTier,
  parseProposedValue,
} from './publish';

describe('classifyDraft', () => {
  it('auto-approves a factual field with confidence at the high-confidence threshold', () => {
    const decision = classifyDraft({
      field_name: 'phone',
      current_value: '(707) 000-0000',
      confidence: AUTO_APPROVE_HIGH_CONFIDENCE,
    });
    expect(decision).toEqual({ auto: true, reason: 'factual_high_confidence' });
  });

  it('does not auto-approve a factual update below the high-confidence threshold', () => {
    const decision = classifyDraft({
      field_name: 'phone',
      current_value: '(707) 000-0000',
      confidence: 0.85,
    });
    expect(decision.auto).toBe(false);
    expect(decision.reason).toBe('low_confidence');
  });

  it('auto-approves a factual addition at the looser addition threshold', () => {
    const decision = classifyDraft({
      field_name: 'address_city',
      current_value: null,
      confidence: AUTO_APPROVE_ADDITION_CONFIDENCE,
    });
    expect(decision).toEqual({ auto: true, reason: 'factual_addition' });
  });

  it('still requires review for a factual addition below the addition threshold', () => {
    const decision = classifyDraft({
      field_name: 'address_city',
      current_value: null,
      confidence: 0.6,
    });
    expect(decision).toEqual({ auto: false, reason: 'low_confidence' });
  });

  it('never auto-approves a field that affects match scoring', () => {
    const decision = classifyDraft({
      field_name: 'reservation_type',
      current_value: null,
      confidence: 1,
    });
    expect(decision).toEqual({ auto: false, reason: 'affects_matching' });
  });

  it('never auto-approves experience flags even if they do not affect scoring', () => {
    const decision = classifyDraft({
      field_name: 'has_cave_tour',
      current_value: 'false',
      confidence: 0.99,
    });
    expect(decision).toEqual({ auto: false, reason: 'experience_flag' });
  });

  it('never auto-approves editorial content', () => {
    const decision = classifyDraft({
      field_name: 'description',
      current_value: null,
      confidence: 0.99,
    });
    expect(decision).toEqual({ auto: false, reason: 'editorial_content' });
  });

  it('never auto-approves style scores', () => {
    const decision = classifyDraft({
      field_name: 'style_classic',
      current_value: '3',
      confidence: 1,
    });
    expect(decision).toEqual({ auto: false, reason: 'style_score' });
  });

  it('never auto-approves experience flags even when they affect matching', () => {
    const decision = classifyDraft({
      field_name: 'is_dog_friendly',
      current_value: 'false',
      confidence: 1,
    });
    expect(decision).toEqual({ auto: false, reason: 'experience_flag' });
  });

  it('never auto-approves editorial judgments like is_hidden_gem', () => {
    const decision = classifyDraft({
      field_name: 'is_hidden_gem',
      current_value: 'false',
      confidence: 1,
    });
    expect(decision).toEqual({ auto: false, reason: 'editorial_judgment' });
  });

  it('rejects unknown field names', () => {
    const decision = classifyDraft({
      field_name: 'made_up_field',
      current_value: null,
      confidence: 1,
    });
    expect(decision).toEqual({ auto: false, reason: 'unknown_field' });
  });

  it('treats null confidence as zero', () => {
    const decision = classifyDraft({
      field_name: 'phone',
      current_value: null,
      confidence: null,
    });
    expect(decision.auto).toBe(false);
    expect(decision.reason).toBe('low_confidence');
  });
});

describe('parseProposedValue', () => {
  it('parses boolean "true" and "false"', () => {
    expect(parseProposedValue('is_dog_friendly', 'true')).toBe(true);
    expect(parseProposedValue('is_dog_friendly', 'false')).toBe(false);
  });

  it('throws on invalid boolean text', () => {
    expect(() => parseProposedValue('is_dog_friendly', 'yes')).toThrow(/Invalid boolean/);
  });

  it('parses integers and rejects non-integers', () => {
    expect(parseProposedValue('max_group_size', '8')).toBe(8);
    expect(parseProposedValue('style_classic', '5')).toBe(5);
    expect(() => parseProposedValue('max_group_size', '5.5')).toThrow(/Invalid integer/);
    expect(() => parseProposedValue('max_group_size', 'abc')).toThrow(/Invalid integer/);
  });

  it('parses hours JSON and rejects malformed payloads', () => {
    const payload = JSON.stringify({ monday: { open: '10:00', close: '17:00' } });
    expect(parseProposedValue('hours', payload)).toEqual({
      monday: { open: '10:00', close: '17:00' },
    });
    expect(() => parseProposedValue('hours', 'not json')).toThrow(/Invalid hours JSON/);
    expect(() => parseProposedValue('hours', '"string"')).toThrow(/Invalid hours JSON/);
    expect(() => parseProposedValue('hours', '[1,2,3]')).toThrow(/Invalid hours JSON/);
  });

  it('returns text values as-is', () => {
    expect(parseProposedValue('tagline', '  A warm bottle of Pinot  ')).toBe(
      '  A warm bottle of Pinot  ',
    );
  });

  it('throws on unknown field names', () => {
    expect(() => parseProposedValue('ghost_field', 'whatever')).toThrow(/Unknown publish field/);
  });
});

describe('buildWineryPatch', () => {
  it('merges multiple drafts into a single typed patch', () => {
    const patch = buildWineryPatch([
      { field_name: 'phone', proposed_value: '(707) 555-0101' },
      { field_name: 'is_dog_friendly', proposed_value: 'true' },
      { field_name: 'max_group_size', proposed_value: '12' },
    ]);
    expect(patch).toEqual({
      phone: '(707) 555-0101',
      is_dog_friendly: true,
      max_group_size: 12,
    });
  });

  it('throws if any draft references an unknown field', () => {
    expect(() =>
      buildWineryPatch([
        { field_name: 'phone', proposed_value: '(707) 555-0101' },
        { field_name: 'mystery', proposed_value: 'value' },
      ]),
    ).toThrow(/Unknown publish field/);
  });
});

describe('nextCoverageTier', () => {
  it('promotes discovered → verified on first publish', () => {
    expect(nextCoverageTier('discovered')).toBe('verified');
  });

  it('leaves verified and editorial tiers unchanged', () => {
    expect(nextCoverageTier('verified')).toBe('verified');
    expect(nextCoverageTier('editorial')).toBe('editorial');
  });
});

describe('isPublishableField', () => {
  it('accepts every field referenced in the extract stage', () => {
    expect(isPublishableField('phone')).toBe(true);
    expect(isPublishableField('hours')).toBe(true);
    expect(isPublishableField('tagline')).toBe(true);
    expect(isPublishableField('style_classic')).toBe(true);
    expect(isPublishableField('quality_score')).toBe(true);
  });

  it('rejects columns the publisher is not allowed to touch directly', () => {
    expect(isPublishableField('id')).toBe(false);
    expect(isPublishableField('latitude')).toBe(false);
    expect(isPublishableField('name')).toBe(false);
  });
});
