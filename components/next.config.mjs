/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@wagmi/connectors/metaMask": false,
    };
    return config;
  },
};

export default nextConfig;
