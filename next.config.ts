import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // J-QuantsとEDINETへのfetchはサーバーサイドのみ
  serverExternalPackages: [],
}

export default nextConfig
