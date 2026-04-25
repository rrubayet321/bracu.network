import type { NextConfig } from 'next';

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : '*.supabase.co';

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Stop MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Limit referrer information
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable unused browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              `default-src 'self'`,
              // Scripts: self + GA + Clarity (inline scripts needed for Next.js)
              `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.clarity.ms`,
              // Styles: self + inline (CSS-in-JS / globals)
              `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
              // Fonts
              `font-src 'self' https://fonts.gstatic.com`,
              // Images: self + Supabase storage + data URIs (for upload preview)
              `img-src 'self' data: blob: https://${supabaseHostname}`,
              // API calls: self + Supabase
              `connect-src 'self' https://${supabaseHostname} https://www.google-analytics.com`,
              // No plugins, objects, or frames
              `object-src 'none'`,
              `frame-ancestors 'none'`,
              `base-uri 'self'`,
              `form-action 'self'`,
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
