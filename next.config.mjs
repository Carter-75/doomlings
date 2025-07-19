/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://carter-portfolio.fyi https://www.carter-portfolio.fyi",
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ];
  },
  // Allow cross-origin requests from preview domains
  experimental: {
    allowedDevOrigins: [
      'localhost:3000',
      'doomlings-arena.preview.emergentagent.com'
    ]
  },
  // Removed output: 'export' to enable Socket.IO server
};

export default nextConfig;
