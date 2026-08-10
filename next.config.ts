import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained Node.js server in addition to the existing Worker
  // output. Sites keeps using dist/server, while CloudBase Run can deploy the
  // standalone server from dist/standalone without platform-specific code.
  output: "standalone",
};

export default nextConfig;
