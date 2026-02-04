/** @type {import('next').NextConfig} */
const nextConfig = {
  // SECURITY: Do not expose server-side secrets to client via env config
  // Service role key should only be used in API routes
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.output.globalObject = 'self';
    }
    config.module.rules.push({
      test: /\.worker\.js$/,
      loader: 'worker-loader',
      options: {
        filename: 'static/[hash].worker.js',
        publicPath: '/_next/',
      },
    });
    return config;
  },
}

module.exports = nextConfig;