import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = 'image/png';

export const PALETTE = {
  bark: '#2A1810',
  barkDeep: '#1A0F0A',
  wine: '#722F37',
  wineDark: '#4A1C22',
  wineLight: '#8F3D47',
  gold: '#C4A469',
  goldLight: '#D8B97A',
  cream: '#F7F2EC',
  linen: '#F1EBE2',
  oak: '#8B7355',
  stone: '#A69B8A',
} as const;

export type HeroPhoto = 'grapes-vine' | 'vineyard-rolling' | 'vineyard-rows' | 'wine-tasting';

const imageCache = new Map<HeroPhoto, string>();

export function loadHeroDataUrl(name: HeroPhoto): string {
  const cached = imageCache.get(name);
  if (cached) return cached;
  const buf = readFileSync(join(process.cwd(), 'public', 'hero', `${name}.jpg`));
  const dataUrl = `data:image/jpeg;base64,${buf.toString('base64')}`;
  imageCache.set(name, dataUrl);
  return dataUrl;
}

type FontWeight = 400 | 500 | 600 | 700;

interface FontSpec {
  family: 'Cormorant Garamond' | 'Inter';
  weight: FontWeight;
}

const fontCache = new Map<string, ArrayBuffer>();

async function loadGoogleFont({ family, weight }: FontSpec): Promise<ArrayBuffer> {
  const key = `${family}-${weight}`;
  const cached = fontCache.get(key);
  if (cached) return cached;
  const familyParam = family.replace(/ /g, '+');
  const cssUrl = `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weight}&display=swap`;
  // Older Chrome UA forces Google Fonts to serve legacy formats (WOFF/TTF) —
  // Satori (which powers @vercel/og) supports TTF/OTF/WOFF but not WOFF2.
  const css = await fetch(cssUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.118 Safari/537.36',
    },
  }).then((r) => r.text());
  // Google returns one @font-face block per subset (cyrillic, greek, latin, ...);
  // we only need the latin block for our text.
  const latinSplit = css.split(/\/\*\s*latin\s*\*\//i);
  const block = latinSplit.length > 1 ? latinSplit[latinSplit.length - 1] : css;
  const fontUrl = block.match(/src:\s*url\(([^)]+)\)/)?.[1];
  if (!fontUrl) throw new Error(`Could not resolve font URL for ${family} ${weight}`);
  const data = await fetch(fontUrl).then((r) => r.arrayBuffer());
  fontCache.set(key, data);
  return data;
}

export interface OgFont {
  name: string;
  data: ArrayBuffer;
  style: 'normal';
  weight: FontWeight;
}

export async function loadOgFonts(): Promise<OgFont[]> {
  const specs: FontSpec[] = [
    { family: 'Cormorant Garamond', weight: 500 },
    { family: 'Cormorant Garamond', weight: 600 },
    { family: 'Cormorant Garamond', weight: 700 },
    { family: 'Inter', weight: 400 },
    { family: 'Inter', weight: 500 },
  ];
  const datas = await Promise.all(specs.map(loadGoogleFont));
  return specs.map((spec, i) => ({
    name: spec.family,
    data: datas[i],
    style: 'normal' as const,
    weight: spec.weight,
  }));
}
