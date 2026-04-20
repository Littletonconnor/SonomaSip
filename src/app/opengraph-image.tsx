import { ImageResponse } from 'next/og';
import { loadHeroDataUrl, loadOgFonts, OG_CONTENT_TYPE, OG_SIZE, PALETTE } from '@/lib/og/assets';

export const alt = 'Sonoma Sip — Your Personalized Sonoma County Winery Guide';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OGImage() {
  const [hero, fonts] = await Promise.all([
    Promise.resolve(loadHeroDataUrl('vineyard-rolling')),
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
              'linear-gradient(95deg, rgba(26,15,10,0.94) 0%, rgba(42,24,16,0.82) 42%, rgba(42,24,16,0.45) 78%, rgba(42,24,16,0.25) 100%)',
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
              marginBottom: 24,
            }}
          >
            Sonoma County Winery Guide
          </span>

          <div
            style={{
              fontFamily: 'Cormorant Garamond',
              fontWeight: 600,
              fontSize: 104,
              lineHeight: 1.0,
              letterSpacing: '-0.02em',
              color: PALETTE.cream,
              maxWidth: 900,
            }}
          >
            Plan your Sonoma wine day.
          </div>

          <div style={{ width: 72, height: 1, background: PALETTE.gold, marginTop: 32 }} />

          <div
            style={{
              fontFamily: 'Inter',
              fontWeight: 400,
              fontSize: 26,
              lineHeight: 1.4,
              color: 'rgba(247, 242, 236, 0.82)',
              marginTop: 28,
              maxWidth: 780,
            }}
          >
            A personalized itinerary from curated wineries — matched to your taste, budget, and
            group.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 44 }}>
            {['Take the Quiz', 'Get Matched', 'Plan Your Day'].map((label, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {i > 0 && (
                  <span
                    style={{
                      fontSize: 18,
                      color: 'rgba(196, 164, 105, 0.55)',
                    }}
                  >
                    ·
                  </span>
                )}
                <span
                  style={{
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    fontSize: 18,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(247, 242, 236, 0.82)',
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
