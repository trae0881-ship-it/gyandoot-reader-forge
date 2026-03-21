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

const useSEO = ({ title, description, canonical, ogImage, ogType, jsonLd }: SEOProps) => {
  useEffect(() => {
    // Title
    document.title = title.includes("GyandootNova") ? title : `${title} | GyandootNova`;

    // Meta description
    if (description) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (meta) meta.content = description;
    }

    // OG tags
    const setOG = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (el) el.content = content;
    };
    setOG("og:title", title);
    if (description) setOG("og:description", description);
    if (ogType) setOG("og:type", ogType);
    if (ogImage) setOG("og:image", ogImage);
    if (canonical) setOG("og:url", `${BASE_URL}${canonical}`);

    // Twitter
    const setTwitter = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (el) el.content = content;
    };
    setTwitter("twitter:title", title);
    if (description) setTwitter("twitter:description", description);

    // Canonical
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (link) link.href = `${BASE_URL}${canonical}`;
    }

    // JSON-LD
    let scriptEl: HTMLScriptElement | null = null;
    if (jsonLd) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.id = "dynamic-jsonld";
      scriptEl.textContent = JSON.stringify(jsonLd);
      // Remove existing dynamic one
      document.getElementById("dynamic-jsonld")?.remove();
      document.head.appendChild(scriptEl);
    }

    return () => {
      scriptEl?.remove();
    };
  }, [title, description, canonical, ogImage, ogType, jsonLd]);
};

export default useSEO;
