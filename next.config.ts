import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Игнорируем все .node файлы (нативные модули)
    config.externals = [...(config.externals || []), 
      "@libsql/win32-x64-msvc",
      "@libsql/hrana-client",
      "@libsql/core"
    ]
    
    // Игнорируем .md и LICENSE файлы
    config.module.rules.push({
      test: /\.(md|txt|LICENSE)$/,
      use: 'ignore-loader'
    })
    
    return config
  },
  images: {
    unoptimized: true,
  },
  experimental: {},
}

export default nextConfig