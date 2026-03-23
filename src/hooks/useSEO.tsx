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

    // OG tags
    const setOG = (property: string, content: string) => {
      getOrCreateMeta("property", property).content = content;
    };
    setOG("og:title", document.title);
    if (description) setOG("og:description", description);
    if (ogType) setOG("og:type", ogType);
    if (ogImage) setOG("og:image", ogImage.startsWith("http") ? ogImage : `${BASE_URL}${ogImage}`);
    if (canonical) setOG("og:url", `${BASE_URL}${canonical}`);

    // Twitter
    const setTwitter = (name: string, content: string) => {
      getOrCreateMeta("name", name).content = content;
    };
    setTwitter("twitter:card", "summary_large_image");
    setTwitter("twitter:title", document.title);
    if (description) setTwitter("twitter:description", description);
    if (ogImage) setTwitter("twitter:image", ogImage.startsWith("http") ? ogImage : `${BASE_URL}${ogImage}`);

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
