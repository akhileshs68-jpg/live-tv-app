/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['firebase-admin'],
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/index.html',
        destination: '/',
        permanent: true,
      },
      {
        source: '/index',
        destination: '/',
        permanent: true,
      },
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/live',
        destination: '/watch',
        permanent: true,
      },
      {
        source: '/tv',
        destination: '/watch',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/pi-app-validation-key.txt',
        destination: '/validation-key.txt',
      },
      {
        source: '/.well-known/pinetwork/validation-key.txt',
        destination: '/validation-key.txt',
      },
      {
        source: '/pi-app-validation-key.txt',
        destination: '/validation-key.txt',
      },
    ];
  },
}

export default nextConfig


