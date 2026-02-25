/** @type {import('next').NextConfig} */

const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const withTM = require("next-transpile-modules")([
  "monaco-editor",
  "@monaco-editor/react",
  "y-monaco",
]);

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_GATEWAY_URL: process.env.NEXT_PUBLIC_API_GATEWAY_URL,
    secrets: process.env.SECRETS,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Allow monaco-editor CSS imports
    const cssRule = config.module.rules.find((rule) =>
      Array.isArray(rule.oneOf)
    )?.oneOf;
    if (cssRule) {
      for (const r of cssRule) {
        if (r.issuer?.include && r.issuer.include.includes("_app")) {
          r.issuer.include = [
            r.issuer.include,
            /[\\/]node_modules[\\/]monaco-editor[\\/]/,
          ];
        }
      }
    }

    if (!isServer) {
      config.plugins.push(
        new MonacoWebpackPlugin({
          languages: ["javascript", "typescript", "json", "css", "html"],
          filename: "static/[name].worker.js",
        })
      );
    }
    return config;
  },
};
module.exports = withTM(nextConfig);
