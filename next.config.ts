import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { useTypeScriptCli: false, workerThreads: true, cpus: 2 },
  // pdfkit (via pdfmake) charge ses polices standard par un import interne (#standard-fonts) :
  // il doit rester hors du bundle serveur, sinon « Cannot find module '#standard-fonts/Helvetica-Bold' ».
  serverExternalPackages: ["pdfmake", "pdfkit"],
  // Ces polices sont chargées dynamiquement : le traçage de Vercel ne les voit pas seul.
  outputFileTracingIncludes: {
    "/comptabilite/journal": ["./node_modules/.pnpm/pdfkit@*/node_modules/pdfkit/js/standard-fonts/*.cjs"],
  },
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
