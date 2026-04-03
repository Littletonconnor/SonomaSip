import { useState, useCallback, useEffect } from 'react';

function parse<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useSessionStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(key);
    if (stored !== null) {
      setValue(parse(stored, initialValue));
    }
    setHydrated(true);
  }, [key, initialValue]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = next instanceof Function ? next(prev) : next;
        sessionStorage.setItem(key, JSON.stringify(resolved));
        return resolved;
      });
    },
    [key],
  );

  const remove = useCallback(() => {
    sessionStorage.removeItem(key);
    setValue(initialValue);
  }, [key, initialValue]);

  return [value, set, { hydrated, remove }] as const;
}
