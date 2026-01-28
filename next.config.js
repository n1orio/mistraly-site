// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'cdn.discordapp.com',  // Discord CDN
      'lh3.googleusercontent.com',  // Google
      'avatars.githubusercontent.com',  // GitHub
    ],
  },
}

module.exports = nextConfig