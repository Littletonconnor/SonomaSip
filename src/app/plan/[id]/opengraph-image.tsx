import { ImageResponse } from 'next/og';
import { getPlan } from '@/lib/plan';

export const alt = 'Sonoma Sip — Wine Day Itinerary';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await getPlan(id);
  const stops = plan?.results.slice(0, 5) ?? [];

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #2D1A1E 0%, #722F37 40%, #4A1C22 100%)',
        fontFamily: 'Georgia, serif',
        padding: '60px 80px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M8 2h8l1 7c0 3.5-2.5 6-5 6s-5-2.5-5-6l1-7z" fill="rgba(255,255,255,0.7)" />
          <path d="M12 15v5" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 22h8" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 20, color: 'rgba(247, 242, 236, 0.6)' }}>Sonoma Sip</span>
      </div>

      <div
        style={{
          fontSize: 48,
          fontWeight: 700,
          color: '#F7F2EC',
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          marginTop: '32px',
        }}
      >
        Wine Day Itinerary
      </div>

      <div
        style={{
          fontSize: 22,
          color: 'rgba(247, 242, 236, 0.55)',
          marginTop: '12px',
        }}
      >
        {stops.length > 0
          ? `${stops.length} curated stops in Sonoma County`
          : 'A curated Sonoma County wine day'}
      </div>

      {stops.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginTop: '40px',
          }}
        >
          {stops.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(196, 164, 105, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#F7F2EC',
                }}
              >
                {r.rank}
              </div>
              <span style={{ fontSize: 22, color: '#F7F2EC', fontWeight: 500 }}>
                {r.winery.name}
              </span>
              <span style={{ fontSize: 18, color: 'rgba(247, 242, 236, 0.4)', marginLeft: '8px' }}>
                {r.winery.region}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>,
    { ...size },
  );
}
