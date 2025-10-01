/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable problematic features for now
  output: 'standalone',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;