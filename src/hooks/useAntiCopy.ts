import { useEffect } from "react";

/**
 * Anti-copy protection. NOTE: JavaScript cannot prevent OS-level or hardware
 * screenshots (mobile Power+Volume, Win+PrtScr, macOS Cmd+Shift+3/4, screen
 * recording apps). It can only deter casual copying in-browser.
 */
export function useAntiCopy() {
  useEffect(() => {
    // Right-click
    const ctx = (e: MouseEvent) => e.preventDefault();
    // Keyboard shortcuts
    const key = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ["s", "p", "c", "x", "u"].includes(k)) {
        e.preventDefault();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c", "s"].includes(k)) {
        e.preventDefault();
      }
      if (k === "f12" || k === "printscreen") {
        e.preventDefault();
        try { navigator.clipboard?.writeText("⚠ Copying is disabled — GyandootNova copyrighted content."); } catch {}
      }
    };
    // Block clipboard copy/cut
    const copy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.clipboardData?.setData("text/plain", "⚠ Copying is disabled — GyandootNova copyrighted content.");
    };
    const cut = (e: ClipboardEvent) => e.preventDefault();
    // Block drag
    const drag = (e: DragEvent) => e.preventDefault();

    document.addEventListener("contextmenu", ctx);
    document.addEventListener("keydown", key);
    document.addEventListener("copy", copy);
    document.addEventListener("cut", cut);
    document.addEventListener("dragstart", drag);
    document.addEventListener("drop", drag);

    // Print blocking via CSS
    const style = document.createElement("style");
    style.id = "anti-copy-print-block";
    style.innerHTML = `
      @media print {
        body * { visibility: hidden !important; }
        body::after {
          content: "⚠ Printing is disabled — GyandootNova copyrighted content.";
          visibility: visible !important;
          position: fixed; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          font-size: 24px; font-weight: bold; color: #B71C1C;
          white-space: nowrap;
        }
      }
      img, video { -webkit-user-drag: none; user-drag: none; }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener("contextmenu", ctx);
      document.removeEventListener("keydown", key);
      document.removeEventListener("copy", copy);
      document.removeEventListener("cut", cut);
      document.removeEventListener("dragstart", drag);
      document.removeEventListener("drop", drag);
      style.remove();
    };
  }, []);
}
