// Shared JSON-LD builders + validators.
// Every page-specific schema goes through these so schema shape stays
// consistent and can be exercised by automated tests.

export const SITE_URL = "https://gyandootnova.in";
export const SITE_NAME = "GyandootNova";
export const SITE_LOGO = `${SITE_URL}/gyandoot-nova-icon.ico`;

type BreadcrumbItem = { name: string; url: string };

export function buildBreadcrumbList(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function buildOrganization(overrides: Record<string, unknown> = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: ["Gyandoot", "Gyandoot Nova", "gyandootnova.in"],
    url: SITE_URL,
    logo: SITE_LOGO,
    email: "amrendra8765@gmail.com",
    telephone: "+91-91615-33353",
    foundingDate: "2024",
    description:
      "A mission-driven publishing house dedicated to authentic spiritual texts — Bhagavad Gita, Vedas, Upanishads, Ramayana and more — for Hindi and English readers.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Bhagwan Khera",
      addressLocality: "Unnao",
      addressRegion: "Uttar Pradesh",
      postalCode: "209863",
      addressCountry: "IN",
    },
    areaServed: ["IN", "US", "GB", "CA", "AU"],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "amrendra8765@gmail.com",
        telephone: "+91-91615-33353",
        availableLanguage: ["Hindi", "English"],
      },
    ],
    ...overrides,
  };
}

export interface ArticleSchemaInput {
  title: string;
  description: string;
  url: string;
  datePublished?: string | null;
  dateModified?: string | null;
  image?: string | null;
  inLanguage?: string;
}

export function buildArticleSchema(a: ArticleSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    url: a.url,
    mainEntityOfPage: { "@type": "WebPage", "@id": a.url },
    ...(a.datePublished ? { datePublished: a.datePublished } : {}),
    ...(a.dateModified ? { dateModified: a.dateModified } : {}),
    inLanguage: a.inLanguage ?? "hi-IN",
    ...(a.image ? { image: a.image } : {}),
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: SITE_LOGO },
    },
  };
}

// ---------- validators ----------

type Issue = string;
export interface ValidationResult {
  valid: boolean;
  issues: Issue[];
}

const ok = (): ValidationResult => ({ valid: true, issues: [] });
const fail = (issues: Issue[]): ValidationResult => ({ valid: false, issues });

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0;
const isAbsoluteUrl = (v: unknown): v is string =>
  typeof v === "string" && /^https?:\/\//i.test(v);

function baseChecks(node: any, expectedType: string): Issue[] {
  const issues: Issue[] = [];
  if (!node || typeof node !== "object") {
    issues.push("node must be an object");
    return issues;
  }
  if (node["@context"] !== "https://schema.org") {
    issues.push('@context must be "https://schema.org"');
  }
  if (node["@type"] !== expectedType) {
    issues.push(`@type must be "${expectedType}", got ${JSON.stringify(node["@type"])}`);
  }
  return issues;
}

export function validateBreadcrumbList(node: any): ValidationResult {
  const issues = baseChecks(node, "BreadcrumbList");
  const items = node?.itemListElement;
  if (!Array.isArray(items) || items.length === 0) {
    issues.push("itemListElement must be a non-empty array");
    return issues.length ? fail(issues) : ok();
  }
  items.forEach((it: any, i: number) => {
    if (it?.["@type"] !== "ListItem") issues.push(`item[${i}].@type must be ListItem`);
    if (it?.position !== i + 1) issues.push(`item[${i}].position must be ${i + 1}`);
    if (!isNonEmptyString(it?.name)) issues.push(`item[${i}].name must be a non-empty string`);
    if (!isAbsoluteUrl(it?.item)) issues.push(`item[${i}].item must be an absolute URL`);
  });
  return issues.length ? fail(issues) : ok();
}

export function validateOrganization(node: any): ValidationResult {
  const issues = baseChecks(node, "Organization");
  if (!isNonEmptyString(node?.name)) issues.push("name required");
  if (!isAbsoluteUrl(node?.url)) issues.push("url must be absolute");
  if (!isAbsoluteUrl(node?.logo)) issues.push("logo must be absolute URL");
  if (node?.contactPoint && !Array.isArray(node.contactPoint)) {
    issues.push("contactPoint must be an array when present");
  }
  return issues.length ? fail(issues) : ok();
}

export function validateArticle(node: any): ValidationResult {
  const issues = baseChecks(node, "Article");
  if (!isNonEmptyString(node?.headline)) issues.push("headline required");
  if (!isNonEmptyString(node?.description)) issues.push("description required");
  if (!isAbsoluteUrl(node?.url)) issues.push("url must be absolute");
  const publisher = node?.publisher;
  if (!publisher || publisher["@type"] !== "Organization")
    issues.push("publisher must be an Organization node");
  else if (!isAbsoluteUrl(publisher?.logo?.url))
    issues.push("publisher.logo.url must be an absolute URL");
  if (!node?.author || (node.author["@type"] !== "Organization" && node.author["@type"] !== "Person"))
    issues.push("author must be an Organization or Person");
  return issues.length ? fail(issues) : ok();
}
