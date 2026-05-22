import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: ({ request }) =>
        request.destination === "style" ||
        request.destination === "script" ||
        request.destination === "font" ||
        request.destination === "image",
      handler: "CacheFirst",
      options: {
        cacheName: "flyahead-static-assets",
        expiration: {
          maxEntries: 120,
          maxAgeSeconds: 60 * 60 * 24 * 30
        }
      }
    },
    {
      urlPattern: ({ url }) => url.pathname.startsWith("/api/flights/search") || url.pathname.startsWith("/flights"),
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "flyahead-flight-search"
      }
    },
    {
      urlPattern: ({ url }) => url.pathname.startsWith("/my-bookings"),
      handler: "NetworkFirst",
      options: {
        cacheName: "flyahead-my-bookings",
        networkTimeoutSeconds: 5
      }
    }
  ],
  fallbacks: {
    document: "/offline"
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      }
    ]
  }
};

export default withPWA(nextConfig);
