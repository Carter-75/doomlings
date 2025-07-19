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
        ],
      },
    ];
  },
  // Removed output: 'export' to enable Socket.IO server
};

export default nextConfig;
