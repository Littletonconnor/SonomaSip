import { ImageResponse } from 'next/og';
import { getWineryBySlug } from '@/lib/data/wineries';
import { loadHeroDataUrl, loadOgFonts, OG_CONTENT_TYPE, OG_SIZE, PALETTE } from '@/lib/og/assets';

export const alt = 'Sonoma Sip — Sonoma County Winery';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const winery = await getWineryBySlug(slug);

  const name = winery?.name ?? 'Sonoma County Winery';
  const regionLine = winery
    ? `${winery.region} · ${winery.city}`
    : 'A curated Sonoma experience';
  const tagline =
    winery?.tagline ?? 'A curated Sonoma County winery — matched by Sonoma Sip.';
  const priceLine = winery
    ? `$${winery.minFlightPrice}–$${winery.maxFlightPrice} per flight`
    : null;
  const topVarietals = winery?.signatureVarietals.slice(0, 3) ?? [];

  const [hero, fonts] = await Promise.all([
    Promise.resolve(loadHeroDataUrl('grapes-vine')),
    loadOgFonts(),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: PALETTE.barkDeep,
          fontFamily: 'Inter',
        }}
      >
        <img
          src={hero}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(95deg, rgba(26,15,10,0.94) 0%, rgba(42,24,16,0.82) 45%, rgba(42,24,16,0.42) 82%, rgba(42,24,16,0.22) 100%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            padding: '64px 80px',
            display: 'flex',
            flexDirection: 'column',
            color: PALETTE.cream,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 32, height: 1, background: PALETTE.gold }} />
            <span
              style={{
                fontFamily: 'Inter',
                fontWeight: 500,
                fontSize: 18,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: PALETTE.goldLight,
              }}
            >
              Sonoma Sip
            </span>
          </div>

          <div style={{ flex: 1 }} />

          <span
            style={{
              fontFamily: 'Inter',
              fontWeight: 500,
              fontSize: 18,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: PALETTE.goldLight,
              marginBottom: 22,
            }}
          >
            {regionLine}
          </span>

          <div
            style={{
              fontFamily: 'Cormorant Garamond',
              fontWeight: 600,
              fontSize: name.length > 28 ? 72 : name.length > 20 ? 86 : 100,
              lineHeight: 1.0,
              letterSpacing: '-0.02em',
              color: PALETTE.cream,
              maxWidth: 960,
            }}
          >
            {name}
          </div>

          <div style={{ width: 72, height: 1, background: PALETTE.gold, marginTop: 28 }} />

          <div
            style={{
              fontFamily: 'Inter',
              fontWeight: 400,
              fontSize: 24,
              lineHeight: 1.4,
              color: 'rgba(247, 242, 236, 0.8)',
              marginTop: 24,
              maxWidth: 820,
              display: 'flex',
            }}
          >
            {tagline}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 40,
              flexWrap: 'wrap',
            }}
          >
            {priceLine && (
              <span
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 500,
                  fontSize: 18,
                  color: PALETTE.cream,
                  background: 'rgba(114, 47, 55, 0.65)',
                  border: '1px solid rgba(196, 164, 105, 0.45)',
                  padding: '10px 20px',
                  borderRadius: 999,
                  letterSpacing: '0.02em',
                }}
              >
                {priceLine}
              </span>
            )}
            {topVarietals.map((v) => (
              <span
                key={v}
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 500,
                  fontSize: 18,
                  color: 'rgba(247, 242, 236, 0.85)',
                  background: 'rgba(42, 24, 16, 0.5)',
                  border: '1px solid rgba(247, 242, 236, 0.22)',
                  padding: '10px 20px',
                  borderRadius: 999,
                  letterSpacing: '0.02em',
                }}
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
