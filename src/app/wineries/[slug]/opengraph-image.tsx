import { ImageResponse } from 'next/og';
import { getWineryBySlug } from '@/lib/data/wineries';

export const alt = 'Sonoma Sip — Sonoma County Winery';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const winery = await getWineryBySlug(slug);

  const name = winery?.name ?? 'Sonoma County Winery';
  const regionLine = winery ? `${winery.region} · ${winery.city}` : 'A curated Sonoma County experience';
  const tagline = winery?.tagline ?? '';
  const priceLine = winery
    ? `$${winery.minFlightPrice}–$${winery.maxFlightPrice} per flight`
    : null;
  const topVarietals = winery?.signatureVarietals.slice(0, 3) ?? [];

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
          fontSize: 64,
          fontWeight: 700,
          color: '#F7F2EC',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          marginTop: '48px',
        }}
      >
        {name}
      </div>

      <div
        style={{
          fontSize: 24,
          color: 'rgba(247, 242, 236, 0.65)',
          marginTop: '16px',
        }}
      >
        {regionLine}
      </div>

      {tagline && (
        <div
          style={{
            fontSize: 22,
            color: 'rgba(247, 242, 236, 0.45)',
            marginTop: '24px',
            lineHeight: 1.35,
            maxWidth: '900px',
            display: 'flex',
          }}
        >
          {tagline}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex' }} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        {priceLine && (
          <span
            style={{
              fontSize: 20,
              color: '#F7F2EC',
              fontWeight: 500,
              background: 'rgba(196, 164, 105, 0.25)',
              padding: '10px 18px',
              borderRadius: '999px',
            }}
          >
            {priceLine}
          </span>
        )}
        {topVarietals.map((v) => (
          <span
            key={v}
            style={{
              fontSize: 18,
              color: 'rgba(247, 242, 236, 0.85)',
              background: 'rgba(247, 242, 236, 0.1)',
              padding: '10px 18px',
              borderRadius: '999px',
            }}
          >
            {v}
          </span>
        ))}
      </div>
    </div>,
    { ...size },
  );
}
