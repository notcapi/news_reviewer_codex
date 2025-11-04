import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  modularizeImports: {
    "date-fns": {
      transform: "date-fns/{{member}}",
    },
  },
};

export default nextConfig;
