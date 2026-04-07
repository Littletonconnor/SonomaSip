/**
 * Firecrawl client for crawling winery websites.
 *
 * Uses the Firecrawl REST API directly (no SDK dependency).
 * Crawls up to 10 pages per winery, returns clean markdown.
 *
 * Requires FIRECRAWL_API_KEY environment variable.
 */

const FIRECRAWL_BASE = 'https://api.firecrawl.dev/v1';
const MAX_PAGES = 5;
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120_000;

// Only follow links whose path contains these keywords (regex patterns for Firecrawl includePaths)
const INCLUDE_PATTERNS = [
  '.*visit.*',
  '.*tasting.*',
  '.*taste.*',
  '.*wines.*',
  '.*hours.*',
  '.*reservation.*',
  '.*book.*',
  '.*about.*',
  '.*contact.*',
  '.*club.*',
  '.*experience.*',
];

export interface CrawlPage {
  url: string;
  title: string | null;
  markdown: string;
  wordCount: number;
}

export interface CrawlResult {
  success: boolean;
  pages: CrawlPage[];
  error?: string;
}

function getApiKey(): string {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) throw new Error('FIRECRAWL_API_KEY environment variable is required');
  return key;
}

async function firecrawlRequest(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<unknown> {
  const res = await fetch(`${FIRECRAWL_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Firecrawl API error ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * Scrape a single page and return its markdown content.
 * Use this for targeted single-page fetches (e.g., homepage only).
 */
export async function scrapePage(url: string): Promise<CrawlPage | null> {
  const data = (await firecrawlRequest('/scrape', {
    method: 'POST',
    body: {
      url,
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: 2000,
    },
  })) as { success: boolean; data?: { markdown?: string; metadata?: { title?: string } } };

  if (!data.success || !data.data?.markdown) return null;

  const markdown = data.data.markdown;
  return {
    url,
    title: data.data.metadata?.title ?? null,
    markdown,
    wordCount: markdown.split(/\s+/).length,
  };
}

/**
 * Crawl a winery website (up to MAX_PAGES pages).
 * Starts an async crawl job, polls for completion, returns all pages.
 */
export async function crawlWebsite(websiteUrl: string): Promise<CrawlResult> {
  // Start the crawl job
  const startData = (await firecrawlRequest('/crawl', {
    method: 'POST',
    body: {
      url: websiteUrl,
      limit: MAX_PAGES,
      includePaths: INCLUDE_PATTERNS,
      scrapeOptions: {
        formats: ['markdown'],
        onlyMainContent: true,
      },
    },
  })) as { success: boolean; id?: string; error?: string };

  if (!startData.success || !startData.id) {
    return { success: false, pages: [], error: startData.error ?? 'Failed to start crawl' };
  }

  const jobId = startData.id;

  // Poll for completion
  const startTime = Date.now();
  while (Date.now() - startTime < POLL_TIMEOUT_MS) {
    await sleep(POLL_INTERVAL_MS);

    const status = (await firecrawlRequest(`/crawl/${jobId}`)) as {
      status: string;
      data?: Array<{
        markdown?: string;
        metadata?: { title?: string; sourceURL?: string };
      }>;
      error?: string;
    };

    if (status.status === 'completed') {
      const pages: CrawlPage[] = (status.data ?? [])
        .filter((d) => d.markdown)
        .map((d) => ({
          url: d.metadata?.sourceURL ?? websiteUrl,
          title: d.metadata?.title ?? null,
          markdown: d.markdown!,
          wordCount: d.markdown!.split(/\s+/).length,
        }));

      return { success: true, pages };
    }

    if (status.status === 'failed') {
      return { success: false, pages: [], error: status.error ?? 'Crawl job failed' };
    }
  }

  return { success: false, pages: [], error: `Crawl timed out after ${POLL_TIMEOUT_MS / 1000}s` };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
