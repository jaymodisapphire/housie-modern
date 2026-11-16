/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Bypasses the ESLint v9 compatibility bug during Vercel builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;