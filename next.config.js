const { withClerkMiddleware } = require('@clerk/nextjs/api');

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;