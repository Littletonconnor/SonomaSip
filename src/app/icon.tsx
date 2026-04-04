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
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M8 2h8l1 7c0 3.5-2.5 6-5 6s-5-2.5-5-6l1-7z" fill="rgba(255,255,255,0.9)" />
        <path d="M12 15v5" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 22h8" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>,
    { ...size },
  );
}
