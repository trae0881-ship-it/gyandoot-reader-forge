// Typed JSON-LD schema builders. Keep these output-only — no DOM, no React.
// Consumers pass the returned object to useSEO({ jsonLd }).

const SITE = "https://gyandootnova.in";
const ORG_NAME = "GyandootNova";
const ORG_LOGO = `${SITE}/og-default.jpg`;

export interface FAQItem {
  question: string;
  answer: string;
}

export interface CrumbItem {
  name: string;
  path: string;
}

export function buildFAQSchema(items: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

export function buildBreadcrumbSchema(crumbs: CrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.path.startsWith("http") ? c.path : `${SITE}${c.path}`,
    })),
  };
}

export function buildArticleSchema(opts: {
  headline: string;
  description: string;
  path: string;
  datePublished?: string;
  dateModified?: string;
  inLanguage?: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.headline,
    description: opts.description,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE}${opts.path}`,
    },
    author: { "@type": "Organization", name: ORG_NAME, url: SITE },
    publisher: {
      "@type": "Organization",
      name: ORG_NAME,
      logo: { "@type": "ImageObject", url: ORG_LOGO },
    },
    datePublished: opts.datePublished ?? "2024-01-01",
    dateModified: opts.dateModified ?? new Date().toISOString().slice(0, 10),
    inLanguage: opts.inLanguage ?? "en",
    image: opts.image ?? ORG_LOGO,
  };
}

export function buildBookSchema(opts: {
  name: string;
  alternateName?: string[];
  description: string;
  path: string;
  author?: string;
  language?: string;
  numberOfPages?: number;
  bookFormat?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: opts.name,
    alternateName: opts.alternateName,
    description: opts.description,
    url: `${SITE}${opts.path}`,
    author: opts.author ? { "@type": "Person", name: opts.author } : undefined,
    inLanguage: opts.language ?? "sa",
    numberOfPages: opts.numberOfPages,
    bookFormat: opts.bookFormat ?? "https://schema.org/EBook",
    publisher: { "@type": "Organization", name: ORG_NAME },
  };
}
