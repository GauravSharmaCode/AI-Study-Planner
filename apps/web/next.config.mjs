/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Avoid 308 from /api/v1/.../ to /api/v1/... which then hits nginx 301 → absolute :8080 URL
  // (browser follows cross-origin redirect without Authorization → 401 on plans).
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ];
  },
};

export default nextConfig;
