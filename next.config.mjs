/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root so Next doesn't pick up an unrelated lockfile in the home dir.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
