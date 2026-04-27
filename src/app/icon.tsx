import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default async function Icon() {
  // Read the SVG from the public folder and embed it as an image
  const svgData = await readFile(
    join(process.cwd(), 'public', 'minimal-flat-b-and-n-should-be-inside-b--deep-navy.svg')
  );
  const svgBase64 = `data:image/svg+xml;base64,${svgData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 7,
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        <img src={svgBase64} width={32} height={32} alt="" />
      </div>
    ),
    { ...size }
  );
}
