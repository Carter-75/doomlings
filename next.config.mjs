/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Capacitor
  output: 'export',
  trailingSlash: true,
  
  // Basic configuration
  images: {
    unoptimized: true,
  },
  
  // Disable problematic features for deployment
  poweredByHeader: false,
};

export default nextConfig;