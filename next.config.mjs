/** @type {import('next').NextConfig} */
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

const createConfig = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  const isVercel = process.env.VERCEL === '1';
  const isRender = process.env.RENDER === 'true';

  return {
    output: (isVercel || isRender || isDev) ? undefined : 'export',
    trailingSlash: false,

    // When doing a static Capacitor export, ignore API route files (.ts)
    pageExtensions: (isVercel || isRender || isDev) ? ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'] : ['tsx', 'jsx', 'js'],

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

    ...(isVercel && {
      async headers() {
        return [
          {
            // Apply these headers to all API routes
            source: "/api/:path*",
            headers: [
              { key: "Access-Control-Allow-Credentials", value: "true" },
              { key: "Access-Control-Allow-Origin", value: "*" }, // allow any origin, including Capacitor's localhost
              { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
              { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, playerId" },
            ]
          }
        ]
      }
    }),
  };
};

export default createConfig;