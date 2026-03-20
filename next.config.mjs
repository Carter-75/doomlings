/** @type {import('next').NextConfig} */
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

const createConfig = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  const isVercel = process.env.VERCEL === '1';

  return {
    output: isVercel ? undefined : 'export',
    trailingSlash: false,

    // When doing a static Capacitor export, ignore API route files (.ts)
    pageExtensions: isVercel ? ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'] : ['tsx', 'jsx', 'js'],

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