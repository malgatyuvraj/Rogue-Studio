import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker deployment (produces standalone output)
  output: "standalone",

  // Security headers applied to all routes
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            "connect-src 'self' http://127.0.0.1:* http://localhost:* ws://localhost:* ws://127.0.0.1:*",
            "frame-ancestors 'none'",
          ].join("; "),
        },
      ],
    },
  ],

  // Disable x-powered-by header
  poweredByHeader: false,
};

export default nextConfig;
