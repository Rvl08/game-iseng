/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Enable WebSocket and real-time connections for Colyseus
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  swcMinify: false,
  webpack: (config, { isServer, dev }) => {
    // Fix for Colyseus client - don't transpile ES6 classes
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      // Disable minification for production to preserve classes
      if (!dev) {
        config.optimization.minimize = false;
      }
    }

    return config;
  },
}

module.exports = nextConfig
