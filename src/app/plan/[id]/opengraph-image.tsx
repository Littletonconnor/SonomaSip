import { ImageResponse } from 'next/og';
import { getPlan } from '@/lib/plan';
import { loadHeroDataUrl, loadOgFonts, OG_CONTENT_TYPE, OG_SIZE, PALETTE } from '@/lib/og/assets';

export const alt = 'Sonoma Sip — Wine Day Itinerary';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await getPlan(id);
  const stops = plan?.results.slice(0, 4) ?? [];
  const stopCount = plan?.results.length ?? 0;

  const regions = Array.from(new Set(stops.map((r) => r.winery.region)));
  const regionSummary =
    regions.length === 0
      ? 'A curated Sonoma County wine day'
      : regions.length === 1
        ? `${stopCount} stops across ${regions[0]}`
        : `${stopCount} stops across ${regions.slice(0, 2).join(' & ')}${regions.length > 2 ? ' + more' : ''}`;

  const [hero, fonts] = await Promise.all([
    Promise.resolve(loadHeroDataUrl('wine-tasting')),
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
              'linear-gradient(95deg, rgba(26,15,10,0.94) 0%, rgba(42,24,16,0.85) 48%, rgba(42,24,16,0.45) 85%, rgba(42,24,16,0.25) 100%)',
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
            Your Sonoma Itinerary
          </span>

          <div
            style={{
              fontFamily: 'Cormorant Garamond',
              fontWeight: 600,
              fontSize: 92,
              lineHeight: 1.0,
              letterSpacing: '-0.02em',
              color: PALETTE.cream,
              maxWidth: 900,
            }}
          >
            A Wine Day, Personally Planned.
          </div>

          <div style={{ width: 72, height: 1, background: PALETTE.gold, marginTop: 28 }} />

          <div
            style={{
              fontFamily: 'Inter',
              fontWeight: 400,
              fontSize: 26,
              lineHeight: 1.4,
              color: 'rgba(247, 242, 236, 0.82)',
              marginTop: 24,
              maxWidth: 820,
              display: 'flex',
            }}
          >
            {regionSummary}
          </div>

          {stops.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginTop: 36,
                flexWrap: 'wrap',
              }}
            >
              {stops.map((r) => (
                <div
                  key={r.rank}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: 'rgba(42, 24, 16, 0.55)',
                    border: '1px solid rgba(196, 164, 105, 0.35)',
                    padding: '10px 16px 10px 10px',
                    borderRadius: 999,
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: PALETTE.wine,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'Inter',
                      fontWeight: 600,
                      fontSize: 15,
                      color: PALETTE.cream,
                    }}
                  >
                    {r.rank}
                  </div>
                  <span
                    style={{
                      fontFamily: 'Inter',
                      fontWeight: 500,
                      fontSize: 18,
                      color: PALETTE.cream,
                      letterSpacing: '0.01em',
                    }}
                  >
                    {r.winery.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
