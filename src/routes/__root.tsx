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
      { title: "Lovable App" },
      { property: "og:title", content: "Lovable App" },
      { name: "twitter:title", content: "Lovable App" },
      { name: "description", content: "Humanix Connect es una plataforma premium de talento para el sector salud en Colombia, que utiliza IA para una contratación eficiente y una gestión de servicios" },
      { property: "og:description", content: "Humanix Connect es una plataforma premium de talento para el sector salud en Colombia, que utiliza IA para una contratación eficiente y una gestión de servicios" },
      { name: "twitter:description", content: "Humanix Connect es una plataforma premium de talento para el sector salud en Colombia, que utiliza IA para una contratación eficiente y una gestión de servicios" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4595d0a1-79a1-4a47-9535-f70ce48e455c/id-preview-1e84d168--ea6fc079-e3d3-421b-9a3b-b62e3ddcdc44.lovable.app-1779196797092.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4595d0a1-79a1-4a47-9535-f70ce48e455c/id-preview-1e84d168--ea6fc079-e3d3-421b-9a3b-b62e3ddcdc44.lovable.app-1779196797092.png" },
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
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','2544561375984277');fbq('track','PageView');`,
          }}
        />
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
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=2544561375984277&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
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
