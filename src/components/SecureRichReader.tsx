import { useMemo } from "react";
import DOMPurify from "dompurify";

interface SecureRichReaderProps {
  content: string;
  fontSize: number;
  darkMode: boolean;
  watermarkText: string;
}

const isHtml = (s: string) => /<\/?(p|div|span|strong|em|br|h[1-6]|ul|ol|li|blockquote|img|a|table|thead|tbody|tr|td|th|pre|code|figure|figcaption)\b/i.test(s);

const textToHtml = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br/>")}</p>`)
    .join("");

const SecureRichReader = ({ content, fontSize, darkMode, watermarkText }: SecureRichReaderProps) => {
  const safeHtml = useMemo(() => {
    const raw = (content ?? "").trim();
    if (!raw) return "<p>इस अध्याय की सामग्री उपलब्ध नहीं है।</p>";
    const html = isHtml(raw) ? raw : textToHtml(raw);
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p", "br", "strong", "em", "u", "s", "sub", "sup",
        "h1", "h2", "h3", "h4", "h5", "h6",
        "ul", "ol", "li", "blockquote", "hr",
        "a", "img", "figure", "figcaption",
        "table", "thead", "tbody", "tr", "td", "th",
        "pre", "code", "span", "div",
      ],
      ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "colspan", "rowspan", "class", "style"],
      ALLOW_DATA_ATTR: false,
    });
  }, [content]);

  return (
    <div className="relative" data-secure-reader="true">
      <div
        className={`secure-rich-reader ${darkMode ? "is-dark" : ""}`}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: 1.85,
          fontFamily: '"Inter", system-ui, -apple-system, "Noto Sans Devanagari", "Noto Serif Devanagari", sans-serif',
          color: darkMode ? "#f3f4f6" : "inherit",
          userSelect: "text",
          WebkitUserSelect: "text",
        }}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
      {/* Watermark overlay — purely visual, never blocks content */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          backgroundImage: `repeating-linear-gradient(-30deg, transparent 0 140px, ${
            darkMode ? "rgba(255,255,255,0.05)" : "rgba(183,28,28,0.06)"
          } 140px 141px)`,
          mixBlendMode: darkMode ? "screen" : "multiply",
          zIndex: 1,
        }}
      >
        <div
          className="absolute inset-0 flex flex-wrap content-start gap-x-16 gap-y-20 p-8"
          style={{
            transform: "rotate(-22deg)",
            transformOrigin: "center",
            opacity: darkMode ? 0.07 : 0.09,
            fontSize: 14,
            fontWeight: 600,
            color: darkMode ? "#ffffff" : "#B71C1C",
            letterSpacing: "0.12em",
            whiteSpace: "nowrap",
          }}
        >
          {Array.from({ length: 80 }).map((_, i) => (
            <span key={i}>{watermarkText} • Protected</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecureRichReader;
