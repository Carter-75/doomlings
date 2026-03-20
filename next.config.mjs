/** @type {import('next').NextConfig} */
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

const createConfig = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    // Static export for Android, but Vercel will still run API routes dynamically when deployed
    output: 'export',
    trailingSlash: false,

    images: {
      unoptimized: true,
    },

    eslint: {
      ignoreDuringBuilds: true,
    },

    typescript: {
      ignoreBuildErrors: true,
    },

    poweredByHeader: false,
  };
};

export default createConfig;