import { ImageResponse } from 'next/og';

export const alt = 'Sonoma Sip — Your Personalized Sonoma County Winery Guide';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #2D1A1E 0%, #722F37 40%, #4A1C22 100%)',
        fontFamily: 'Georgia, serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <svg
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M8 2h8l1 7c0 3.5-2.5 6-5 6s-5-2.5-5-6l1-7z" fill="rgba(255,255,255,0.85)" />
          <path
            d="M12 15v5"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M8 22h8" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <div
        style={{
          fontSize: 64,
          fontWeight: 700,
          color: '#F7F2EC',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          textAlign: 'center',
          maxWidth: '900px',
        }}
      >
        Sonoma Sip
      </div>

      <div
        style={{
          fontSize: 28,
          color: 'rgba(247, 242, 236, 0.7)',
          marginTop: '20px',
          textAlign: 'center',
          maxWidth: '700px',
          lineHeight: 1.4,
        }}
      >
        Your personalized guide to Sonoma County wineries
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          marginTop: '48px',
          fontSize: 18,
          color: 'rgba(247, 242, 236, 0.5)',
        }}
      >
        <span>Take the Quiz</span>
        <span style={{ color: 'rgba(247, 242, 236, 0.25)' }}>·</span>
        <span>Get Matched</span>
        <span style={{ color: 'rgba(247, 242, 236, 0.25)' }}>·</span>
        <span>Plan Your Day</span>
      </div>
    </div>,
    { ...size },
  );
}
