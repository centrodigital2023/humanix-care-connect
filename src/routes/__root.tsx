import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { FloatingWAChat } from "@/components/humanix/FloatingWAChat";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Humanix · Talento humano en salud para Colombia" },
      {
        name: "description",
        content:
          "Plataforma premium con IA en tiempo real que conecta profesionales de salud con familias y clínicas en Colombia.",
      },
      { name: "author", content: "Humanix" },
      { name: "theme-color", content: "#0A192F" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Humanix · Talento humano en salud para Colombia" },
      { name: "twitter:title", content: "Humanix · Talento humano en salud para Colombia" },
      { name: "description", content: "Humanix Connect is a premium healthcare talent platform for Colombia, using AI for efficient hiring and real-time service management." },
      { property: "og:description", content: "Humanix Connect is a premium healthcare talent platform for Colombia, using AI for efficient hiring and real-time service management." },
      { name: "twitter:description", content: "Humanix Connect is a premium healthcare talent platform for Colombia, using AI for efficient hiring and real-time service management." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a3d9349f-0993-4c7c-a8e1-756062f16222/id-preview-1f2d5b0a--ea6fc079-e3d3-421b-9a3b-b62e3ddcdc44.lovable.app-1776797247133.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a3d9349f-0993-4c7c-a8e1-756062f16222/id-preview-1f2d5b0a--ea6fc079-e3d3-421b-9a3b-b62e3ddcdc44.lovable.app-1776797247133.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "dns-prefetch", href: "https://fonts.googleapis.com" },
      { rel: "dns-prefetch", href: "https://fonts.gstatic.com" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <Outlet />
      <FloatingWAChat />
      <Toaster richColors position="top-right" />
    </>
  );
}
