/** @type {import('next').NextConfig} */
const nextConfig = {
  // Basic configuration for Vercel deployment
  images: {
    unoptimized: true,
  },
  
  // Disable problematic features for deployment
  poweredByHeader: false,
  
  // Set the root directory to avoid workspace detection issues
  outputFileTracingRoot: '/vercel/path0',
};

export default nextConfig;