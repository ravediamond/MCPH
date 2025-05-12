/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['mcph.io', 'www.mcph.io'],
    // We don't need unoptimized with Vercel
    // unoptimized: true, 
  },
  // We don't need output: 'export' with Vercel
  // output: 'export', 

  // We don't need a distDir with Vercel
  // distDir: 'out', 

  // Vercel handles API routes, so no need for trailing slashes
  // trailingSlash: true, 

  // Configure webpack for Node.js core modules in browser
  webpack: (config, { isServer }) => {
    // Add fallbacks for Node.js core modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
        http: require.resolve('http-browserify'),
        net: require.resolve('net-browserify'),
        https: require.resolve('https-browserify'),
        crypto: require.resolve('crypto-browserify'),
        tls: require.resolve('tls-browserify'),
      };
    }

    // Return the modified config
    return config;
  },
};

module.exports = nextConfig;
