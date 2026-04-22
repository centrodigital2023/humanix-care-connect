export const SITE_NAME = "Humanix";
export const SITE_URL = "https://humanix-care-connect.lovable.app";
export const SITE_DESCRIPTION =
  "Plataforma premium con IA en tiempo real que conecta profesionales de salud con familias y clínicas en Colombia.";
export const SOCIAL_IMAGE_URL =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a3d9349f-0993-4c7c-a8e1-756062f16222/id-preview-1f2d5b0a--ea6fc079-e3d3-421b-9a3b-b62e3ddcdc44.lovable.app-1776797247133.png";
export const SOCIAL_IMAGE_ALT =
  "Humanix · Talento humano en salud verificado con IA para Colombia";
export const SOCIAL_IMAGE_WIDTH = "1200";
export const SOCIAL_IMAGE_HEIGHT = "630";
export const TWITTER_HANDLE = "@HumanixColombia";
export const DEFAULT_LOCALE = "es_CO";

type Meta = {
  name?: string;
  property?: string;
  content?: string;
  title?: string;
  httpEquiv?: string;
  charSet?: string;
};
type Link = {
  rel: string;
  href: string;
  type?: string;
  hrefLang?: string;
  crossOrigin?: "anonymous" | "use-credentials" | "";
};

export type SeoOptions = {
  /** Page title. `SITE_NAME` is appended automatically if `appendSiteName` is true. */
  title: string;
  description?: string;
  /** Workspace-relative path (starts with `/`) used to build canonical + og:url. */
  path: string;
  /** Use a custom OG/Twitter image. Defaults to SOCIAL_IMAGE_URL. */
  image?: string;
  imageAlt?: string;
  /** Prevent indexing (e.g. dashboards, servicio, auth). */
  noindex?: boolean;
  /** og:type, defaults to `website`. */
  type?: "website" | "article" | "profile";
  /** If true (default), appends " · Humanix" to title (when not already present). */
  appendSiteName?: boolean;
  /** Extra meta/links to append. */
  extraMeta?: Meta[];
  extraLinks?: Link[];
};

/**
 * Build the `head()` payload for a TanStack Router route with consistent SEO:
 * canonical, OpenGraph, Twitter Card, robots, locale and hreflang.
 */
export function buildSeo(opts: SeoOptions): { meta: Meta[]; links: Link[] } {
  const {
    title: rawTitle,
    description = SITE_DESCRIPTION,
    path,
    image = SOCIAL_IMAGE_URL,
    imageAlt = SOCIAL_IMAGE_ALT,
    noindex = false,
    type = "website",
    appendSiteName = true,
    extraMeta = [],
    extraLinks = [],
  } = opts;

  const title =
    appendSiteName && !rawTitle.includes(SITE_NAME)
      ? `${rawTitle} · ${SITE_NAME}`
      : rawTitle;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url =
    normalizedPath === "/"
      ? SITE_URL
      : `${SITE_URL}${normalizedPath.replace(/\/$/, "")}`;

  const meta: Meta[] = [
    { title },
    { name: "description", content: description },
    {
      name: "robots",
      content: noindex
        ? "noindex,nofollow"
        : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
    },
    { property: "og:type", content: type },
    { property: "og:locale", content: DEFAULT_LOCALE },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:url", content: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { property: "og:image:alt", content: imageAlt },
    { property: "og:image:width", content: SOCIAL_IMAGE_WIDTH },
    { property: "og:image:height", content: SOCIAL_IMAGE_HEIGHT },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: TWITTER_HANDLE },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: imageAlt },
    ...extraMeta,
  ];

  const links: Link[] = [
    { rel: "canonical", href: url },
    { rel: "alternate", hrefLang: "es-CO", href: url },
    { rel: "alternate", hrefLang: "x-default", href: url },
    ...extraLinks,
  ];

  return { meta, links };
}

/**
 * Serialize structured data so it can be embedded as JSON-LD via
 * `dangerouslySetInnerHTML`. Escapes `</script>` to prevent HTML injection.
 */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Reusable JSON-LD builders ------------------------------------------------ */

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    sameAs: [
      "https://www.linkedin.com/company/humanix-co",
      "https://x.com/HumanixColombia",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "contacto@humanix.co",
        availableLanguage: ["Spanish"],
        areaServed: "CO",
      },
    ],
  } as const;
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "es-CO",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/buscar?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  } as const;
}

export function breadcrumbLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path.startsWith("/") ? it.path : `/${it.path}`}`,
    })),
  } as const;
}

export function faqLd(items: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  } as const;
}
