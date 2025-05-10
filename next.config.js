/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['mcph.io', 'www.mcph.io'],
    unoptimized: true, // Disable the Image Optimization API for static export
  },
  output: 'export', // Enable static HTML export for Firebase Hosting
  distDir: 'out', // Output to 'out' directory for Firebase Hosting
  // We'll handle the API routes with Cloud Functions
  trailingSlash: true, // For better Firebase Hosting compatibility
  webpack: (config, { isServer }) => {
    // Add fallbacks for Node.js core modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'), // Often needed with stream
        http: require.resolve('http-browserify'), // Added http fallback
        net: require.resolve('net-browserify'), // Added net fallback
        https: require.resolve('https-browserify'), // Added https fallback
        crypto: require.resolve('crypto-browserify'), // Added crypto fallback
        tls: require.resolve('tls-browserify'), // Added tls fallback
      };
    }

    // Important: return the modified config
    return config;
  },
};

module.exports = nextConfig;
