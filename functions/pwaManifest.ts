/**
 * PWA Manifest Generator
 * Serves the manifest.json file for PWA installation
 */

Deno.serve(async (req) => {
  const manifest = {
    name: "Base44 Platform",
    short_name: "Base44",
    description: "Comprehensive job and customer management platform",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111827",
    orientation: "portrait-primary",
    icons: [
      {
        src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23111827'/><text x='50' y='50' font-size='50' text-anchor='middle' dominant-baseline='middle' fill='white' font-family='sans-serif'>B44</text></svg>",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any maskable"
      },
      {
        src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23111827'/><text x='50' y='50' font-size='50' text-anchor='middle' dominant-baseline='middle' fill='white' font-family='sans-serif'>B44</text></svg>",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable"
      }
    ],
    categories: ["business", "productivity"],
    shortcuts: [
      {
        name: "Dashboard",
        url: "/Dashboard",
        description: "View dashboard"
      },
      {
        name: "Jobs",
        url: "/Jobs",
        description: "Manage jobs"
      },
      {
        name: "Customers",
        url: "/Customers",
        description: "Manage customers"
      }
    ]
  };

  return new Response(JSON.stringify(manifest), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400'
    }
  });
});