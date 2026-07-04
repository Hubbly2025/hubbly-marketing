/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/pricing",
        destination: "/#audit",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
