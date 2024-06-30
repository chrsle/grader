/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          path: false,
          crypto: false,
        };
      }
      return config;
    },
    images: {
      domains: ['localhost'],
    },
  };
  
  export default nextConfig;