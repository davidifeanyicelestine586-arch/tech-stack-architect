import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/content-detail",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
