import { createRequire } from "module";
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["mcph.io", "www.mcph.io"],
    // We don't need unoptimized with Vercel
    // unoptimized: true,
  },
  // We don't need output: 'export' with Vercel
  // output: 'export',

  // We don't need a distDir with Vercel
  // distDir: 'out',

  // Vercel handles API routes, so no need for trailing slashes
  // trailingSlash: true,

  // Exclude the MCP directory from the Next.js build
  pageExtensions: ["tsx", "ts", "jsx", "js"],

  // Configure webpack for Node.js core modules in browser
  webpack: (config, { isServer }) => {
    // Exclude the MCP directory from the build
    config.externals = [
      ...(config.externals || []),
      { "@modelcontextprotocol/sdk": "commonjs @modelcontextprotocol/sdk" },
    ];

    // Add a rule to ignore the MCP folder
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /mcp[\\/].*\.ts$/,
      loader: "ignore-loader",
    });

    // Add fallbacks for Node.js core modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer/"),
        http: require.resolve("http-browserify"),
        net: require.resolve("net-browserify"),
        https: require.resolve("https-browserify"),
        crypto: require.resolve("crypto-browserify"),
        tls: require.resolve("tls-browserify"),
      };
    }

    // Return the modified config
    return config;
  },
};

export default nextConfig;
