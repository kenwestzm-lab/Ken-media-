/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: { serverActions: true },
  images: {
    domains: ['firebasestorage.googleapis.com','lh3.googleusercontent.com','res.cloudinary.com'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        undici: false,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        'node-fetch': false,
        'node:buffer': false,
        'node:stream': false,
        'node:util': false,
        'node:net': false,
        'node:tls': false,
      }
    }
    return config
  },
}
module.exports = nextConfig
