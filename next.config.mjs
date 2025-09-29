/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: { optimizeCss: false },
  basePath: '/console',
  assetPrefix: '/console',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
      {
        source: '/mcp/:path*',
        destination: 'http://localhost:8000/mcp/:path*',
      },
    ]
  },
  async redirects() {
    return [
      // Avoid double basePath (/console/console)
      { source: '/', destination: '/console', permanent: false, basePath: false },
    ]
  },
}

export default nextConfig