/** @type {import('next').NextConfig} */
const basePath = "";

const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Empty basePath = serve at the root of the custom domain
  // (rathiatithibhawan.org). When this was running under the
  // GitHub Pages default URL (username.github.io/repo-name), it
  // needed to be "/rathi-atithi-customer".
  basePath: basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  trailingSlash: true,
};

module.exports = nextConfig;
