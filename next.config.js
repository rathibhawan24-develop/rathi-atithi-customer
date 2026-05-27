/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // If serving from a subdirectory on GitHub Pages (username.github.io/repo-name),
  // uncomment and set basePath. With a custom domain via CNAME, leave commented.
  // basePath: '/rathi-atithi-customer',
  trailingSlash: true,
};

module.exports = nextConfig;
