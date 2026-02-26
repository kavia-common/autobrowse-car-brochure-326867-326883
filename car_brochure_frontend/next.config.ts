import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export mode (`output: "export"`) is incompatible with dynamic App Router
  // routes unless every possible param is known at build time. This app relies on
  // backend data that may change (cars can be created/removed via admin), so we
  // run as a normal Next.js app.
};

export default nextConfig;
