/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    // Legacy WordPress-era URLs that still receive traffic/backlinks.
    return [
      {
        source: "/hubbly-growth",
        destination: "/platform",
        permanent: true,
      },
      {
        source: "/how-it-works",
        destination: "/#how-it-works",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
