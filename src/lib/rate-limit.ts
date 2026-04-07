type Entry = {
  tokens: number;
  lastRefill: number;
};

type RateLimiterConfig = {
  maxTokens: number;
  refillRate: number;
  refillInterval: number;
};

const stores = new Map<string, Map<string, Entry>>();

function getStore(name: string): Map<string, Entry> {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);
  }
  return store;
}

function evictStale(store: Map<string, Entry>, maxAge: number) {
  if (store.size < 5000) return;
  const cutoff = Date.now() - maxAge;
  for (const [key, entry] of store) {
    if (entry.lastRefill < cutoff) store.delete(key);
  }
}

export function createRateLimiter(name: string, config: RateLimiterConfig) {
  const store = getStore(name);

  return {
    check(key: string): { allowed: boolean; retryAfter: number } {
      evictStale(store, config.refillInterval * 10);

      const now = Date.now();
      let entry = store.get(key);

      if (!entry) {
        entry = { tokens: config.maxTokens, lastRefill: now };
        store.set(key, entry);
      }

      const elapsed = now - entry.lastRefill;
      const refills = Math.floor(elapsed / config.refillInterval);

      if (refills > 0) {
        entry.tokens = Math.min(config.maxTokens, entry.tokens + refills * config.refillRate);
        entry.lastRefill = now;
      }

      if (entry.tokens >= 1) {
        entry.tokens -= 1;
        return { allowed: true, retryAfter: 0 };
      }

      const msUntilRefill = config.refillInterval - (now - entry.lastRefill);
      return { allowed: false, retryAfter: Math.ceil(msUntilRefill / 1000) };
    },
  };
}

export const globalLimiter = createRateLimiter('global', {
  maxTokens: 60,
  refillRate: 60,
  refillInterval: 60_000,
});

export const quizLimiter = createRateLimiter('quiz', {
  maxTokens: 10,
  refillRate: 10,
  refillInterval: 3_600_000,
});

export const planLimiter = createRateLimiter('plan', {
  maxTokens: 5,
  refillRate: 5,
  refillInterval: 3_600_000,
});
