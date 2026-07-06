import { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  jsonLd?: Record<string, unknown>;
}

const BASE_URL = "https://gyandootnova.in";
const DEFAULT_OG = "/og-default.jpg";
const DEFAULT_OG_W = "1216";
const DEFAULT_OG_H = "640";

const getOrCreateMeta = (attr: string, value: string): HTMLMetaElement => {
  let el = document.querySelector(`meta[${attr}="${value}"]`) as HTMLMetaElement;
  if (!el) {
    el = document.createElement("meta");
    const [key] = attr === "property" ? ["property"] : ["name"];
    el.setAttribute(key, value);
    document.head.appendChild(el);
  }
  return el;
};

const useSEO = ({ title, description, canonical, ogImage, ogType, jsonLd }: SEOProps) => {
  useEffect(() => {
    // Title
    document.title = title.includes("GyandootNova") ? title : `${title} | GyandootNova`;

    // Meta description
    if (description) {
      getOrCreateMeta("name", "description").content = description;
    }

    // Resolve og:image — always emit an absolute URL and known dimensions so
    // social crawlers get a stable placeholder even when cover_url is missing.
    const rawImage = ogImage && ogImage.trim().length > 0 ? ogImage : DEFAULT_OG;
    const absImage = rawImage.startsWith("http") ? rawImage : `${BASE_URL}${rawImage}`;
    const isDefault = rawImage === DEFAULT_OG;

    // OG tags
    const setOG = (property: string, content: string) => {
      getOrCreateMeta("property", property).content = content;
    };
    setOG("og:title", document.title);
    if (description) setOG("og:description", description);
    if (ogType) setOG("og:type", ogType);
    setOG("og:image", absImage);
    setOG("og:image:alt", title);
    if (isDefault) {
      setOG("og:image:width", DEFAULT_OG_W);
      setOG("og:image:height", DEFAULT_OG_H);
      setOG("og:image:type", "image/jpeg");
    }
    if (canonical) setOG("og:url", `${BASE_URL}${canonical}`);

    // Twitter
    const setTwitter = (name: string, content: string) => {
      getOrCreateMeta("name", name).content = content;
    };
    setTwitter("twitter:card", "summary_large_image");
    setTwitter("twitter:title", document.title);
    if (description) setTwitter("twitter:description", description);
    setTwitter("twitter:image", absImage);
    setTwitter("twitter:image:alt", title);

    // Canonical
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = `${BASE_URL}${canonical}`;
    }

    // JSON-LD
    let scriptEl: HTMLScriptElement | null = null;
    if (jsonLd) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.id = "dynamic-jsonld";
      scriptEl.textContent = JSON.stringify(jsonLd);
      document.getElementById("dynamic-jsonld")?.remove();
      document.head.appendChild(scriptEl);
    }

    return () => {
      scriptEl?.remove();
    };
  }, [title, description, canonical, ogImage, ogType, jsonLd]);
};


export default useSEO;
