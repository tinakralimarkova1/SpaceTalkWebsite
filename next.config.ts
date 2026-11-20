import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  async redirects() {
    return [
      {
        source: "/spring-2021",
        destination: "/archive#spring-2021",
        permanent: true,
      },
      {
        source: "/summer-2021",
        destination: "/archive#summer-2021",
        permanent: true,
      },
      {
        source: "/2025-fall",
        destination: "/archive#fall-2025",
        permanent: true,
      },
    ];
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
