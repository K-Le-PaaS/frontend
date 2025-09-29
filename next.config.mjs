/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: { optimizeCss: false },
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
}

export default nextConfig