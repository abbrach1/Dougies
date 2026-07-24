/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Type errors now fail the build (the codebase is type-clean). This
    // prevents regressions like the broken email props from shipping silently.
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  eslint: {
    // Lint is not enforced at build time (v0 scaffolding has many style
    // warnings); run `npm run lint` separately.
    ignoreDuringBuilds: true,
  },
  // Keep the email libraries out of the webpack server bundle. Their newer
  // versions ship ESM with top-level await (via prettier in
  // @react-email/render) that Next 14's bundler cannot parse. Externalizing
  // them lets Node load them directly at runtime instead.
  experimental: {
    serverComponentsExternalPackages: ["resend", "@react-email/render", "@react-email/components"],
  },
}

export default nextConfig
