import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

/** Force app root to this folder (avoids picking up ~/package-lock.json). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
