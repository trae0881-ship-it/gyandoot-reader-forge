import { useEffect } from "react";

/**
 * Anti-copy protection. Browsers cannot fully block OS-level screenshots,
 * but this prevents in-browser copy/print/save/select and adds a watermark.
 */
export function useAntiCopy() {
  useEffect(() => {
    const isEditable = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      return !!el?.closest?.("input, textarea, [contenteditable='true'], [data-allow-copy='true']");
    };

    const block = (e: Event) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    };

    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const blockedCombo = (e.ctrlKey || e.metaKey) && ["a", "c", "x", "s", "p", "u"].includes(k);
      const blockedDevTools = (e.ctrlKey || e.metaKey) && e.shiftKey && ["c", "i", "j", "s"].includes(k);

      if (!isEditable(e.target) && (blockedCombo || blockedDevTools || k === "f12" || k === "printscreen")) {
        e.preventDefault();
        e.stopPropagation();
        if (k === "printscreen") {
          try { navigator.clipboard?.writeText("Copying is disabled — GyandootNova copyrighted content."); } catch {}
        }
      }
    };

    const copy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.clipboardData?.setData("text/plain", "Copying is disabled — GyandootNova copyrighted content.");
    };

    const blurOn = () => document.documentElement.classList.add("anti-copy-obscured");
    const blurOff = () => document.documentElement.classList.remove("anti-copy-obscured");
    const onVisibility = () => document.hidden ? blurOn() : blurOff();

    document.addEventListener("contextmenu", block, true);
    document.addEventListener("selectstart", block, true);
    document.addEventListener("dragstart", block, true);
    document.addEventListener("drop", block, true);
    document.addEventListener("keydown", key, true);
    document.addEventListener("copy", copy, true);
    document.addEventListener("cut", copy, true);
    document.addEventListener("visibilitychange", onVisibility, true);
    window.addEventListener("blur", blurOn, true);
    window.addEventListener("focus", blurOff, true);

    const style = document.createElement("style");
    style.id = "gyandoot-anti-copy-protection";
    style.innerHTML = `
      html, body, #root { -webkit-user-select: none !important; user-select: none !important; }
      input, textarea, [contenteditable='true'], [data-allow-copy='true'] { -webkit-user-select: text !important; user-select: text !important; }
      img, video, canvas, svg { -webkit-user-drag: none !important; user-drag: none !important; }
      body::before {
        content: "GyandootNova • Protected";
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        pointer-events: none;
        display: grid;
        place-items: center;
        color: hsl(var(--primary) / 0.12);
        font-size: clamp(1.5rem, 6vw, 4.5rem);
        font-weight: 800;
        transform: rotate(-22deg);
        text-align: center;
      }
      html.anti-copy-obscured body > * { filter: blur(28px) !important; }
      @media print {
        body * { visibility: hidden !important; }
        body::after {
          content: "Printing is disabled — GyandootNova copyrighted content.";
          visibility: visible !important;
          position: fixed; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          font-size: 24px; font-weight: bold; color: hsl(var(--primary));
          white-space: normal; text-align: center; width: min(90vw, 720px);
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener("contextmenu", block, true);
      document.removeEventListener("selectstart", block, true);
      document.removeEventListener("dragstart", block, true);
      document.removeEventListener("drop", block, true);
      document.removeEventListener("keydown", key, true);
      document.removeEventListener("copy", copy, true);
      document.removeEventListener("cut", copy, true);
      document.removeEventListener("visibilitychange", onVisibility, true);
      window.removeEventListener("blur", blurOn, true);
      window.removeEventListener("focus", blurOff, true);
      document.documentElement.classList.remove("anti-copy-obscured");
      style.remove();
    };
  }, []);
}
