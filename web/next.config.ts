import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "pg-cloudflare"],
};

export default nextConfig;

if (process.env.NODE_ENV === "development") initOpenNextCloudflareForDev();
