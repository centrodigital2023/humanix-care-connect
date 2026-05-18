import { Suspense, lazy } from "react";
import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import * as seo from "@/lib/seo";
const {
  DEFAULT_LOCALE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_IMAGE_ALT,
  SOCIAL_IMAGE_HEIGHT,
  SOCIAL_IMAGE_URL,
  SOCIAL_IMAGE_WIDTH,
  TWITTER_HANDLE,
  organizationLd,
  websiteLd,
  localBusinessLd,
  webApplicationLd,
} = seo;

import appCss from "../styles.css?url";

const FloatingWAChat = lazy(() =>
  import("@/components/humanix/FloatingWAChat").then((module) => ({
    default: module.FloatingWAChat,
  })),
);

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
      { title: `${SITE_NAME} · Talento humano en salud para Colombia` },
      { name: "description", content: SITE_DESCRIPTION },
      { name: "author", content: "Humanix" },
      { name: "google-site-verification", content: "ohLJMuczZHl79QIbEcvqP4UgjxZd8LAhhMhWU9IN_mQ" },
      { name: "google-site-verification", content: "VRV9N4tW-XDtV6om0CTekVUNdkjXs25B7AiuG-Lmm4g" },
      { name: "facebook-domain-verification", content: "j33zetynanp07lsxc1k5zzns607pbm" },
      {
        name: "robots",
        content: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
      },
      { name: "theme-color", content: "#0A192F" },
      { name: "format-detection", content: "telephone=no" },
      { name: "apple-mobile-web-app-title", content: SITE_NAME },
      { name: "application-name", content: SITE_NAME },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: DEFAULT_LOCALE },
      { property: "og:url", content: SITE_URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: TWITTER_HANDLE },
      { property: "og:title", content: `${SITE_NAME} · Talento humano en salud para Colombia` },
      { name: "twitter:title", content: `${SITE_NAME} · Talento humano en salud para Colombia` },
      { property: "og:description", content: SITE_DESCRIPTION },
      { name: "twitter:description", content: SITE_DESCRIPTION },
      { property: "og:image", content: SOCIAL_IMAGE_URL },
      { property: "og:image:alt", content: SOCIAL_IMAGE_ALT },
      { property: "og:image:width", content: SOCIAL_IMAGE_WIDTH },
      { property: "og:image:height", content: SOCIAL_IMAGE_HEIGHT },
      { name: "twitter:image", content: SOCIAL_IMAGE_URL },
      { name: "twitter:image:alt", content: SOCIAL_IMAGE_ALT },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "dns-prefetch", href: "https://fonts.googleapis.com" },
      { rel: "dns-prefetch", href: "https://fonts.gstatic.com" },
      { rel: "dns-prefetch", href: "https://rwllmouomrytejtbpxvn.supabase.co" },
      { rel: "dns-prefetch", href: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://rwllmouomrytejtbpxvn.supabase.co" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
      { rel: "sitemap", type: "application/xml", href: "/sitemap.xml" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: seo.jsonLdString(organizationLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: seo.jsonLdString(websiteLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: seo.jsonLdString(localBusinessLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: seo.jsonLdString(webApplicationLd()) }}
        />
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
      <Suspense fallback={null}>
        <FloatingWAChat />
      </Suspense>
      <Toaster richColors position="top-right" />
    </>
  );
}
