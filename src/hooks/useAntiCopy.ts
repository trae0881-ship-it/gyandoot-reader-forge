import { useEffect } from "react";

export function useAntiCopy() {
  // Prevent right-click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  // Prevent text selection
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
    };
    document.addEventListener("selectstart", handler);
    return () => document.removeEventListener("selectstart", handler);
  }, []);

  // Prevent keyboard shortcuts for saving/printing/copying/developer tools
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Block Ctrl+S, Ctrl+P, Ctrl+C, Ctrl+Shift+I, F12, PrintScreen
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S" || e.key === "p" || e.key === "P" || e.key === "c" || e.key === "C")) {
        e.preventDefault();
        return false;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "S" || e.key === "s")) {
        e.preventDefault();
        return false;
      }
      if (e.key === "F12" || e.key === "PrintScreen") {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Detect PrintScreen on keyup
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        e.preventDefault();
        // Clear clipboard
        try {
          navigator.clipboard?.writeText("⚠ Screenshot blocked — GyandootNova copyrighted content");
        } catch {}
      }
    };
    document.addEventListener("keyup", handler);
    return () => document.removeEventListener("keyup", handler);
  }, []);

  // Blur content when page not visible or window loses focus (prevents snipping tools)
  useEffect(() => {
    const blurContent = () => {
      document.body.style.filter = "blur(40px)";
      document.body.style.pointerEvents = "none";
    };
    const unblurContent = () => {
      document.body.style.filter = "none";
      document.body.style.pointerEvents = "auto";
    };

    const handleVisibility = () => {
      if (document.hidden) blurContent(); else unblurContent();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", blurContent);
    window.addEventListener("focus", unblurContent);
    document.addEventListener("mouseleave", blurContent);
    document.addEventListener("mouseenter", unblurContent);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", blurContent);
      window.removeEventListener("focus", unblurContent);
      document.removeEventListener("mouseleave", blurContent);
      document.removeEventListener("mouseenter", unblurContent);
      unblurContent();
    };
  }, []);

  // Prevent clipboard copy
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.setData("text/plain", "⚠ Copying is disabled for copyrighted content.");
      }
    };
    document.addEventListener("copy", handler);
    return () => document.removeEventListener("copy", handler);
  }, []);

  // Prevent clipboard cut
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      e.preventDefault();
    };
    document.addEventListener("cut", handler);
    return () => document.removeEventListener("cut", handler);
  }, []);

  // Block drag & drop events
  useEffect(() => {
    const handler = (e: DragEvent) => {
      e.preventDefault();
    };
    document.addEventListener("dragstart", handler);
    document.addEventListener("drop", handler);
    return () => {
      document.removeEventListener("dragstart", handler);
      document.removeEventListener("drop", handler);
    };
  }, []);

  // Inject @media print CSS — hide content when printing
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "anti-copy-print-block";
    style.innerHTML = `
      @media print {
        body * { visibility: hidden !important; }
        body::after {
          content: "⚠ Printing is disabled for copyrighted content.";
          visibility: visible !important;
          position: fixed; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          font-size: 24px; font-weight: bold; color: #B71C1C;
          white-space: nowrap;
        }
      }
      body {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById("anti-copy-print-block")?.remove(); };
  }, []);

  // DevTools detection — blur if devtools opens
  useEffect(() => {
    const threshold = 160;
    const check = () => {
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if (widthDiff || heightDiff) {
        document.body.style.filter = "blur(30px)";
      } else {
        if (document.body.style.filter.includes("blur(30")) {
          document.body.style.filter = "none";
        }
      }
    };
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, []);
}
