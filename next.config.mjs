/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoName = "/caredrop";

const nextConfig = {
  output: isGithubPages ? "export" : undefined,
  basePath: isGithubPages ? repoName : "",
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['node:sqlite'],
  },
  reactStrictMode: false,
};

export default nextConfig;
