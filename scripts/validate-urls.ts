import { parseCSV, indexById } from './lib/parse-csv';

type UrlCheckResult = {
  wineryId: string;
  wineryName: string;
  field: 'website' | 'reservation_url';
  url: string;
  status: 'ok' | 'redirect' | 'broken' | 'timeout' | 'not-https' | 'invalid';
  httpStatus?: number;
  redirectUrl?: string;
  error?: string;
};

const TIMEOUT_MS = 10_000;
const CONCURRENCY = 5;
const DELAY_MS = 200;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function checkUrl(
  url: string,
): Promise<Omit<UrlCheckResult, 'wineryId' | 'wineryName' | 'field' | 'url'>> {
  if (!url) return { status: 'invalid', error: 'Empty URL' };

  try {
    new URL(url);
  } catch {
    return { status: 'invalid', error: 'Malformed URL' };
  }

  if (!url.startsWith('https://')) {
    return {
      status: 'not-https',
      error: `Uses ${url.startsWith('http://') ? 'HTTP' : 'unknown protocol'}`,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'manual',
      headers: {
        'User-Agent': 'SonomaSip-URLChecker/1.0 (data-quality)',
      },
    });

    clearTimeout(timeout);

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location') ?? '(unknown)';
      return { status: 'redirect', httpStatus: res.status, redirectUrl: location };
    }

    if (res.status >= 200 && res.status < 300) {
      return { status: 'ok', httpStatus: res.status };
    }

    if (res.status === 405) {
      const getController = new AbortController();
      const getTimeout = setTimeout(() => getController.abort(), TIMEOUT_MS);

      const getRes = await fetch(url, {
        method: 'GET',
        signal: getController.signal,
        redirect: 'manual',
        headers: {
          'User-Agent': 'SonomaSip-URLChecker/1.0 (data-quality)',
        },
      });

      clearTimeout(getTimeout);

      if (getRes.status >= 200 && getRes.status < 300) {
        return { status: 'ok', httpStatus: getRes.status };
      }
      if (getRes.status >= 300 && getRes.status < 400) {
        const location = getRes.headers.get('location') ?? '(unknown)';
        return { status: 'redirect', httpStatus: getRes.status, redirectUrl: location };
      }
      return { status: 'broken', httpStatus: getRes.status };
    }

    return { status: 'broken', httpStatus: res.status };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { status: 'timeout', error: `No response within ${TIMEOUT_MS}ms` };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { status: 'broken', error: msg };
  }
}

async function runBatch<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    if (i + concurrency < items.length) await sleep(DELAY_MS);
  }
  return results;
}

async function main() {
  const coreInfo = parseCSV('core-info.csv');
  const tastingHours = parseCSV('tasting-and-hours.csv');
  const tastingById = indexById(tastingHours);

  const checks: {
    wineryId: string;
    wineryName: string;
    field: 'website' | 'reservation_url';
    url: string;
  }[] = [];

  for (const row of coreInfo) {
    const id = row.id;
    const name = row.name;
    if (row.website) {
      checks.push({ wineryId: id, wineryName: name, field: 'website', url: row.website });
    }
    const tasting = tastingById.get(id);
    if (tasting?.reservation_url) {
      checks.push({
        wineryId: id,
        wineryName: name,
        field: 'reservation_url',
        url: tasting.reservation_url,
      });
    }
  }

  console.log(`Checking ${checks.length} URLs across ${coreInfo.length} wineries...\n`);

  const results: UrlCheckResult[] = await runBatch(checks, CONCURRENCY, async (check) => {
    process.stdout.write(`  ${check.wineryId} (${check.field})...`);
    const result = await checkUrl(check.url);
    const icon = result.status === 'ok' ? '✓' : result.status === 'redirect' ? '→' : '✗';
    process.stdout.write(
      ` ${icon} ${result.status}${result.httpStatus ? ` (${result.httpStatus})` : ''}\n`,
    );
    return { ...check, ...result };
  });

  const ok = results.filter((r) => r.status === 'ok');
  const redirects = results.filter((r) => r.status === 'redirect');
  const broken = results.filter((r) => r.status === 'broken');
  const timeouts = results.filter((r) => r.status === 'timeout');
  const notHttps = results.filter((r) => r.status === 'not-https');
  const invalid = results.filter((r) => r.status === 'invalid');

  console.log('\n' + '='.repeat(70));
  console.log('URL VALIDATION REPORT');
  console.log('='.repeat(70));
  console.log(`Total URLs checked: ${results.length}`);
  console.log(`  ✓ OK:          ${ok.length}`);
  console.log(`  → Redirect:    ${redirects.length}`);
  console.log(`  ✗ Broken:      ${broken.length}`);
  console.log(`  ⏱ Timeout:     ${timeouts.length}`);
  console.log(`  ⚠ Not HTTPS:   ${notHttps.length}`);
  console.log(`  ⚠ Invalid:     ${invalid.length}`);

  const issues = [...broken, ...timeouts, ...notHttps, ...invalid];
  if (issues.length > 0) {
    console.log('\n' + '-'.repeat(70));
    console.log('ISSUES');
    console.log('-'.repeat(70));
    for (const r of issues) {
      console.log(`  ${r.wineryId} [${r.field}]`);
      console.log(`    URL:    ${r.url}`);
      console.log(`    Status: ${r.status}${r.httpStatus ? ` (HTTP ${r.httpStatus})` : ''}`);
      if (r.error) console.log(`    Error:  ${r.error}`);
      console.log();
    }
  }

  if (redirects.length > 0) {
    console.log('-'.repeat(70));
    console.log('REDIRECTS (may need URL update)');
    console.log('-'.repeat(70));
    for (const r of redirects) {
      console.log(`  ${r.wineryId} [${r.field}]`);
      console.log(`    From: ${r.url}`);
      console.log(`    To:   ${r.redirectUrl}`);
      console.log();
    }
  }

  const exitCode = broken.length + invalid.length > 0 ? 1 : 0;
  process.exit(exitCode);
}

main();
