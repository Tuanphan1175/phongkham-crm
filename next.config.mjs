/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs", "bcrypt"],
  },
};

export default nextConfig;
