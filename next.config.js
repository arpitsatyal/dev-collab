/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    SEARCH_SERVICE_URL: process.env.SEARCH_SERVICE_URL,
  },
};

module.exports = nextConfig;
