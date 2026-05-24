import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isProd ? '/ews-price-simulator' : '',
  assetPrefix: isProd ? '/ews-price-simulator/' : '',
  trailingSlash: true,
  images: { unoptimized: true },
}

export default nextConfig
