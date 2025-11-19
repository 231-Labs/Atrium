/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev, isServer }) => {
    config.externals.push('pino-pretty', 'encoding');
    
        if (dev && !isServer) {
      config.devtool = 'eval-source-map';
    }
    
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.walrus.site',
      },
      {
        protocol: 'https',
        hostname: 'aggregator.walrus-testnet.walrus.space',
      },
      {
        protocol: 'https',
        hostname: '**.suifrens.com',
      },
    ],
  },
  // 確保 CSS source maps 在開發模式下正確生成
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;

