/** @type {import('next').NextConfig} */
const basePath = "/rathi-atithi-customer";

const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // If serving from a subdirectory on GitHub Pages (username.github.io/repo-name),
  // keep this. With a custom Hostinger domain via CNAME, set basePath to "" above.
  basePath: basePath,
  env: {
    // Expose basePath to client code (for <img src=...>, etc.)
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  trailingSlash: true,
};

module.exports = nextConfig;
