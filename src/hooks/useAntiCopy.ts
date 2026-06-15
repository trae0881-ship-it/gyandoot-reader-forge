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
      e.preventDefault();
      e.stopPropagation();
    };

    const blockIfNotEditing = (e: Event) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    };

    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const blockedAlways = (e.ctrlKey || e.metaKey) && ["c", "x", "s", "p", "u"].includes(k);
      const blockedSelectAll = !isEditable(e.target) && (e.ctrlKey || e.metaKey) && k === "a";
      const blockedDevTools = (e.ctrlKey || e.metaKey) && e.shiftKey && ["c", "i", "j", "s"].includes(k);

      if (blockedAlways || blockedSelectAll || blockedDevTools || k === "f12" || k === "printscreen") {
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

    let longPressTimer: ReturnType<typeof setTimeout> | null = null;
    const clearLongPress = () => {
      if (longPressTimer) window.clearTimeout(longPressTimer);
      longPressTimer = null;
    };
    const touchStart = (e: TouchEvent) => {
      if (isEditable(e.target)) return;
      clearLongPress();
      longPressTimer = setTimeout(() => {
        window.getSelection()?.removeAllRanges();
      }, 180);
    };

    const blurOn = () => document.documentElement.classList.add("anti-copy-obscured");
    const blurOff = () => document.documentElement.classList.remove("anti-copy-obscured");
    const onVisibility = () => document.hidden ? blurOn() : blurOff();
    const clearSelection = () => window.getSelection()?.removeAllRanges();

    document.addEventListener("contextmenu", block, true);
    document.addEventListener("selectstart", blockIfNotEditing, true);
    document.addEventListener("dragstart", block, true);
    document.addEventListener("drop", block, true);
    document.addEventListener("keydown", key, true);
    document.addEventListener("copy", copy, true);
    document.addEventListener("cut", copy, true);
    document.addEventListener("paste", block, true);
    document.addEventListener("touchstart", touchStart, { capture: true, passive: true });
    document.addEventListener("touchend", clearLongPress, true);
    document.addEventListener("touchcancel", clearLongPress, true);
    document.addEventListener("selectionchange", clearSelection, true);
    document.addEventListener("visibilitychange", onVisibility, true);
    window.addEventListener("blur", blurOn, true);
    window.addEventListener("focus", blurOff, true);

    const watermark = document.createElement("div");
    watermark.id = "gyandoot-secure-watermark-grid";
    watermark.setAttribute("aria-hidden", "true");
    watermark.innerHTML = Array.from({ length: 90 }, () => "<span>GyandootNova • Protected</span>").join("");
    document.body.appendChild(watermark);

    const style = document.createElement("style");
    style.id = "gyandoot-anti-copy-protection";
    style.innerHTML = `
      *, *::before, *::after {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      *::selection { background: transparent !important; color: inherit !important; }
      input, textarea, [contenteditable='true'], [data-allow-copy='true'] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        user-select: text !important;
        -webkit-touch-callout: default !important;
      }
      img, video, canvas, svg { -webkit-user-drag: none !important; user-drag: none !important; }
      #gyandoot-secure-watermark-grid {
        position: fixed;
        inset: -18vh -18vw;
        z-index: 2147483647;
        pointer-events: none;
        display: grid;
        grid-template-columns: repeat(6, minmax(180px, 1fr));
        gap: 3rem 4rem;
        transform: rotate(-24deg);
        opacity: 0.22;
        mix-blend-mode: multiply;
      }
      #gyandoot-secure-watermark-grid span {
        color: hsl(var(--primary) / 0.65);
        font: 800 clamp(0.78rem, 2.4vw, 1.45rem) Inter, system-ui, sans-serif;
        letter-spacing: 0;
        white-space: nowrap;
        text-shadow: 0 0 1px hsl(var(--background) / 0.9);
      }
      body::before {
        content: "";
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        pointer-events: none;
        background-image: repeating-linear-gradient(
          -24deg,
          transparent 0 44px,
          hsl(var(--primary) / 0.16) 45px 46px,
          transparent 47px 96px
        );
        opacity: 0.95;
        mix-blend-mode: multiply;
      }
      body::after {
        content: "GyandootNova • Protected";
        position: fixed;
        left: -20vw;
        top: 0;
        z-index: 2147483647;
        pointer-events: none;
        width: 140vw;
        height: 100vh;
        color: hsl(var(--foreground) / 0.16);
        font-size: clamp(1rem, 4.5vw, 3rem);
        font-weight: 800;
        line-height: 4.2;
        letter-spacing: 0;
        white-space: pre-wrap;
        transform: rotate(-24deg);
        text-align: center;
        word-spacing: 3rem;
        text-shadow: 0 0 1px hsl(var(--background) / 0.55);
      }
      html.anti-copy-obscured body > * { filter: blur(28px) !important; }
      html.anti-copy-obscured #gyandoot-secure-watermark-grid { filter: none !important; opacity: 0.58; }
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
      document.removeEventListener("selectstart", blockIfNotEditing, true);
      document.removeEventListener("dragstart", block, true);
      document.removeEventListener("drop", block, true);
      document.removeEventListener("keydown", key, true);
      document.removeEventListener("copy", copy, true);
      document.removeEventListener("cut", copy, true);
      document.removeEventListener("paste", block, true);
      document.removeEventListener("touchstart", touchStart, true);
      document.removeEventListener("touchend", clearLongPress, true);
      document.removeEventListener("touchcancel", clearLongPress, true);
      document.removeEventListener("selectionchange", clearSelection, true);
      document.removeEventListener("visibilitychange", onVisibility, true);
      clearLongPress();
      window.removeEventListener("blur", blurOn, true);
      window.removeEventListener("focus", blurOff, true);
      document.documentElement.classList.remove("anti-copy-obscured");
      watermark.remove();
      style.remove();
    };
  }, []);
}
