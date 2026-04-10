/**
 * Wine association directory parser.
 *
 * Pure functions for extracting winery member listings from association
 * directory HTML (Sonoma County Vintners, Wine Road). The `scripts/discover-
 * associations.ts` runner wraps these with fetching, dedup, and DB writes.
 */

import { normalizeName } from './dedup';

export type AssociationSourceKey = 'sonoma_vintners' | 'wine_road';

export interface AssociationSourceConfig {
  source: AssociationSourceKey;
  label: string;
  defaultUrls: string[];
  ownDomains: string[];
  memberLinkPattern: RegExp;
  excludeText: RegExp;
}

export interface RawLink {
  href: string;
  text: string;
}

export interface ParsedMember {
  source: AssociationSourceKey;
  source_id: string;
  name: string;
  normalized_name: string;
  website_url: string | null;
  detail_url: string | null;
}

const EXCLUDE_TEXT_RE =
  /^(home|about( us)?|contact( us)?|events?|visit|visiting|news|blog|search|menu|login|sign[- ]?in|sign[- ]?up|join|directory|map( view)?|list( view)?|read more|learn more|view (all|details|profile)|see more|next|prev(ious)?|back|top|skip|subscribe|newsletter|privacy|terms|facebook|twitter|instagram|youtube|tiktok|linkedin|all wineries)$/i;

export const ASSOCIATION_SOURCES: Record<AssociationSourceKey, AssociationSourceConfig> = {
  sonoma_vintners: {
    source: 'sonoma_vintners',
    label: 'Sonoma County Vintners',
    defaultUrls: ['https://sonomavintners.com/find-wineries/', 'https://sonomawine.com/wineries/'],
    ownDomains: ['sonomavintners.com', 'sonomawine.com'],
    memberLinkPattern: /\/(winery|wineries|find-wineries|member|members)\/[a-z0-9][a-z0-9-]{2,}/i,
    excludeText: EXCLUDE_TEXT_RE,
  },
  wine_road: {
    source: 'wine_road',
    label: 'Wine Road (Alexander / Dry Creek / Russian River)',
    defaultUrls: ['https://www.wineroad.com/wineries/', 'https://www.wineroad.com/members/'],
    ownDomains: ['wineroad.com'],
    memberLinkPattern: /\/(winery|wineries|members?|profile)\/[a-z0-9][a-z0-9-]{2,}/i,
    excludeText: EXCLUDE_TEXT_RE,
  },
};

export const SOCIAL_OR_PLATFORM_HOSTS: ReadonlySet<string> = new Set([
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'youtube.com',
  'tiktok.com',
  'linkedin.com',
  'pinterest.com',
  'yelp.com',
  'tripadvisor.com',
  'google.com',
  'maps.google.com',
  'goo.gl',
  'maps.app.goo.gl',
  'apple.com',
  'spotify.com',
  'vimeo.com',
  'eventbrite.com',
  'mailchi.mp',
  'us.mailchimp.com',
  'list-manage.com',
]);

/**
 * Extract every `<a href="...">text</a>` from an HTML string. Nested tags
 * inside link text are stripped so we get a clean plain-text label. Common
 * HTML entities (&amp;, &nbsp;, numeric refs) are decoded.
 */
export function extractAnchors(html: string): RawLink[] {
  const out: RawLink[] = [];
  const re = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const href = (m[1] ?? m[2] ?? '').trim();
    if (!href) continue;
    const text = m[3]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) continue;
    out.push({ href, text });
  }
  return out;
}

/**
 * Normalize a URL by stripping trailing slashes from the path and dropping
 * default ports. Used for storage in winery_registry so the same member
 * isn't inserted twice with trivially different URLs.
 */
function canonicalUrl(u: URL): string {
  const path = u.pathname === '/' ? '' : u.pathname.replace(/\/$/, '');
  return `${u.protocol}//${u.hostname}${path}`;
}

/**
 * Filter raw anchor tags down to plausible winery listings and tag each one
 * with its source-specific identifier. External links become `website_url`
 * directly; internal links that match the source's member URL pattern become
 * `detail_url` (and `website_url` stays null until a later enrichment step).
 */
export function filterMembers(
  links: RawLink[],
  config: AssociationSourceConfig,
  baseUrl: string,
): ParsedMember[] {
  const members: ParsedMember[] = [];
  const seen = new Set<string>();

  for (const link of links) {
    let abs: URL;
    try {
      abs = new URL(link.href, baseUrl);
    } catch {
      continue;
    }

    if (abs.protocol !== 'http:' && abs.protocol !== 'https:') continue;

    const host = abs.hostname.replace(/^www\./, '').toLowerCase();
    if (SOCIAL_OR_PLATFORM_HOSTS.has(host)) continue;

    const text = link.text;
    if (text.length < 3 || text.length > 120) continue;
    if (config.excludeText.test(text)) continue;
    if (/^\d+$/.test(text)) continue;

    const isOwnDomain = config.ownDomains.includes(host);
    const matchesMemberPath = config.memberLinkPattern.test(abs.pathname);

    let website_url: string | null;
    let detail_url: string | null;
    let source_id: string;

    if (isOwnDomain) {
      if (!matchesMemberPath) continue;
      website_url = null;
      detail_url = canonicalUrl(abs);
      source_id = `${host}${abs.pathname.replace(/\/$/, '')}`;
    } else {
      website_url = canonicalUrl(abs);
      detail_url = null;
      source_id = host;
    }

    const normalized = normalizeName(text);
    if (!normalized) continue;

    const key = `${normalized}|${source_id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    members.push({
      source: config.source,
      source_id,
      name: text,
      normalized_name: normalized,
      website_url,
      detail_url,
    });
  }

  return members;
}

/**
 * Convenience wrapper: parse HTML directly into member listings for a source.
 */
export function parseAssociationHtml(
  html: string,
  config: AssociationSourceConfig,
  baseUrl: string,
): ParsedMember[] {
  const links = extractAnchors(html);
  return filterMembers(links, config, baseUrl);
}
