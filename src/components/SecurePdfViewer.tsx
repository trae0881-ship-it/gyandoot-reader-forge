import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Highlighter,
  Loader2,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface SecurePdfViewerProps {
  url: string;
  title: string;
  darkMode: boolean;
  initialPage?: number;
  onPageChange?: (page: number) => void;
}

interface Highlight {
  page: number;
  rects: { x: number; y: number; w: number; h: number }[];
  color: string;
}

const HIGHLIGHT_COLORS = ["#FFEB3B", "#4CAF50", "#2196F3", "#FF9800", "#E91E63"];

const SecurePdfViewer = ({ url, title, darkMode, initialPage, onPageChange }: SecurePdfViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const highlightCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [loading, setLoading] = useState(true);
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlightColor, setHighlightColor] = useState(HIGHLIGHT_COLORS[0]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [pageRendering, setPageRendering] = useState(false);

  // Load PDF document
  useEffect(() => {
    let cancelled = false;
    const loadPdf = async () => {
      setLoading(true);
      try {
        const loadingTask = pdfjsLib.getDocument({
          url,
          disableAutoFetch: true,
          disableStream: false,
        });
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        const startPage = initialPage && initialPage >= 1 && initialPage <= pdf.numPages ? initialPage : 1;
        setCurrentPage(startPage);
        setLoading(false);
      } catch (err) {
        console.error("PDF load error:", err);
        setLoading(false);
      }
    };
    loadPdf();
    return () => { cancelled = true; };
  }, [url]);

  // Render current page
  const renderPage = useCallback(async (pageNum: number) => {
    const pdf = pdfDocRef.current;
    const canvas = canvasRef.current;
    const highlightCanvas = highlightCanvasRef.current;
    const textLayerDiv = textLayerRef.current;
    if (!pdf || !canvas || !highlightCanvas || !textLayerDiv) return;

    setPageRendering(true);

    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // Use device pixel ratio for crisp rendering
      const dpr = window.devicePixelRatio || 1;
      const outputScale = Math.max(dpr, 2); // At least 2x for clarity

      // Setup main canvas
      const ctx = canvas.getContext("2d")!;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      // Enable text smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Setup highlight canvas
      highlightCanvas.width = Math.floor(viewport.width * outputScale);
      highlightCanvas.height = Math.floor(viewport.height * outputScale);
      highlightCanvas.style.width = `${viewport.width}px`;
      highlightCanvas.style.height = `${viewport.height}px`;

      // Clear text layer
      textLayerDiv.innerHTML = "";
      textLayerDiv.style.width = `${viewport.width}px`;
      textLayerDiv.style.height = `${viewport.height}px`;

      // Scale canvas context for high-DPI rendering
      ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

      // Render PDF page to canvas
      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      // Render text layer for selection/highlighting
      const textContent = await page.getTextContent();
      const textItems = textContent.items as any[];

      textItems.forEach((item) => {
        if (!item.str) return;
        const tx = pdfjsLib.Util.transform(
          viewport.transform,
          item.transform
        );
        const span = document.createElement("span");
        span.textContent = item.str;
        span.style.position = "absolute";
        span.style.left = `${tx[4]}px`;
        span.style.top = `${tx[5] - item.height * scale}px`;
        span.style.fontSize = `${item.height * scale}px`;
        span.style.fontFamily = item.fontName || "sans-serif";
        span.style.color = "transparent";
        span.style.whiteSpace = "pre";
        span.style.transformOrigin = "0% 0%";
        textLayerDiv.appendChild(span);
      });

      // Redraw highlights for this page
      drawHighlights(pageNum);
    } catch (err) {
      console.error("Page render error:", err);
    }

    setPageRendering(false);
  }, [scale]);

  // Draw highlights on canvas
  const drawHighlights = useCallback((pageNum: number) => {
    const highlightCanvas = highlightCanvasRef.current;
    if (!highlightCanvas) return;
    const ctx = highlightCanvas.getContext("2d")!;
    ctx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);

    const pageHighlights = highlights.filter((h) => h.page === pageNum);
    pageHighlights.forEach((h) => {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = h.color;
      h.rects.forEach((r) => {
        ctx.fillRect(r.x, r.y, r.w, r.h);
      });
    });
    ctx.globalAlpha = 1;
  }, [highlights]);

  // Re-render when page or scale changes
  useEffect(() => {
    if (numPages > 0) {
      renderPage(currentPage);
      onPageChange?.(currentPage);
    }
  }, [currentPage, scale, numPages, renderPage]);

  // Redraw highlights when they change
  useEffect(() => {
    drawHighlights(currentPage);
  }, [highlights, currentPage, drawHighlights]);

  // Handle text selection for highlighting
  const handleMouseUp = useCallback(() => {
    if (!highlightMode) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();
    const textLayerDiv = textLayerRef.current;
    if (!textLayerDiv || rects.length === 0) return;

    const containerRect = textLayerDiv.getBoundingClientRect();
    const highlightRects: { x: number; y: number; w: number; h: number }[] = [];

    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      highlightRects.push({
        x: r.left - containerRect.left,
        y: r.top - containerRect.top,
        w: r.width,
        h: r.height,
      });
    }

    if (highlightRects.length > 0) {
      setHighlights((prev) => [
        ...prev,
        { page: currentPage, rects: highlightRects, color: highlightColor },
      ]);
    }

    selection.removeAllRanges();
  }, [highlightMode, highlightColor, currentPage]);

  // Auto-fit width on mount
  useEffect(() => {
    const container = containerRef.current;
    if (container && numPages > 0) {
      const containerWidth = container.clientWidth - 32;
      // We'll use a reasonable default scale
      if (containerWidth < 600) {
        setScale(1.0);
      } else if (containerWidth < 900) {
        setScale(1.3);
      } else {
        setScale(1.5);
      }
    }
  }, [numPages]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Loading PDF...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-3">
      {/* Controls */}
      <div
        className={`sticky top-[49px] z-30 flex flex-wrap items-center justify-center gap-2 rounded-lg border px-3 py-2 ${
          darkMode
            ? "border-gray-700 bg-gray-800/95"
            : "border-border bg-muted/95 backdrop-blur"
        }`}
      >
        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1 || pageRendering}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[80px] text-center">
            {currentPage} / {numPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages || pageRendering}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
            disabled={pageRendering}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setScale((s) => Math.min(3, s + 0.2))}
            disabled={pageRendering}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Highlight controls */}
        <div className="flex items-center gap-1">
          <Button
            variant={highlightMode ? "default" : "ghost"}
            size="sm"
            className="h-8 gap-1"
            onClick={() => setHighlightMode(!highlightMode)}
          >
            <Highlighter className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Highlight</span>
          </Button>
          {highlightMode && (
            <div className="flex items-center gap-1">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color}
                  className={`h-5 w-5 rounded-full border-2 transition-transform ${
                    highlightColor === color
                      ? "border-foreground scale-125"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setHighlightColor(color)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PDF Canvas area */}
      <div
        className="relative overflow-auto max-w-full"
        style={{ maxHeight: "calc(100vh - 150px)" }}
        onMouseUp={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          className="block rounded-lg shadow-lg"
          style={{
            filter: darkMode ? "invert(0.88) hue-rotate(180deg)" : "none",
          }}
        />
        <canvas
          ref={highlightCanvasRef}
          className="absolute top-0 left-0 pointer-events-none"
          style={{ mixBlendMode: "multiply" }}
        />
        <div
          ref={textLayerRef}
          className="absolute top-0 left-0"
          style={{
            cursor: highlightMode ? "text" : "default",
            userSelect: highlightMode ? "text" : "none",
            WebkitUserSelect: highlightMode ? "text" : "none",
          }}
        />
      </div>

      {pageRendering && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Rendering...
        </div>
      )}
    </div>
  );
};

export default SecurePdfViewer;
