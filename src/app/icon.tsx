import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #722F37 0%, #4A1C22 100%)',
        borderRadius: '6px',
      }}
    >
      <svg
        width="20"
        height="24"
        viewBox="0 0 20 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7 1 C7 1 5.5 5.5 5.5 8 C5.5 11.5 7.5 13.5 10 14 C12.5 13.5 14.5 11.5 14.5 8 C14.5 5.5 13 1 13 1 Z"
          fill="rgba(255,255,255,0.95)"
        />
        <line x1="10" y1="14" x2="10" y2="20" stroke="rgba(255,255,255,0.95)" strokeWidth="1.4" />
        <line x1="6.5" y1="21" x2="13.5" y2="21" stroke="rgba(255,255,255,0.95)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>,
    { ...size },
  );
}
