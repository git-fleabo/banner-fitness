import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Deliberately no R2 cache binding: the private prototype stays free-tier and
// keeps all durable state in the existing Neon project.
export default defineCloudflareConfig();
