import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { useTypeScriptCli: false, workerThreads: true, cpus: 2 },
  // Le cluster Pusher n'est pas un secret : on réutilise PUSHER_CLUSTER côté navigateur.
  env: {
    NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? process.env.PUSHER_CLUSTER ?? "",
  },
  async redirects() {
    return [
      { source: "/plateforme", destination: "/platform", permanent: false },
      { source: "/plateforme/:path*", destination: "/platform/:path*", permanent: false },
      { source: "/admin", destination: "/platform", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
    
    turbopack: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  
};

export default nextConfig;
