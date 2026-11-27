/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['node:sqlite'],
  },
  reactStrictMode: false, // Prevents duplicate executions during dev testing
};

export default nextConfig;