/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: './tsconfig.ui.json',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Skip font optimization during build if fonts fail to load
  ...(process.env.SKIP_FONT_OPTIMIZATION === '1' ? { optimizeFonts: false } : {}),
};

export default nextConfig;
