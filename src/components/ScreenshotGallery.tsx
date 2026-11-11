"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Layers,
  Sparkles,
} from "lucide-react";
import { getSafeImageUrl } from "@/lib/images";
import type { ScreenshotModel } from "@/lib/db";

interface ScreenshotGalleryProps {
  screenshots: ScreenshotModel[];
}

export default function ScreenshotGallery({
  screenshots,
}: ScreenshotGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Mouse drag-to-scroll state
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const hasDragged = useRef(false);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Drag handlers for desktop mouse swipe
  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    hasDragged.current = false;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftStart.current = scrollRef.current.scrollLeft;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // Scroll speed factor
    if (Math.abs(walk) > 5) {
      hasDragged.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const onMouseUp = () => {
    isDragging.current = false;
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (selectedIdx === null) return;
      if (e.key === "ArrowLeft") {
        setSelectedIdx((prev) =>
          prev !== null && prev > 0 ? prev - 1 : screenshots.length - 1
        );
      } else if (e.key === "ArrowRight") {
        setSelectedIdx((prev) =>
          prev !== null && prev < screenshots.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "Escape") {
        setSelectedIdx(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIdx, screenshots.length]);

  if (!screenshots || screenshots.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Header with Navigation Arrows */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            Screenshot Aplikasi
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {screenshots.length} Foto
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Geser atau klik tombol panah untuk melihat semua tampilan aplikasi.
          </p>
        </div>

        {/* Scroll Arrow Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll Kiri"
            className={`p-2 rounded-xl border transition-all ${
              canScrollLeft
                ? "bg-slate-900 border-slate-700 text-white hover:bg-slate-800 hover:border-blue-500/50 shadow-md cursor-pointer"
                : "bg-slate-950 border-slate-850 text-slate-600 cursor-not-allowed opacity-50"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            aria-label="Scroll Kanan"
            className={`p-2 rounded-xl border transition-all ${
              canScrollRight
                ? "bg-slate-900 border-slate-700 text-white hover:bg-slate-800 hover:border-blue-500/50 shadow-md cursor-pointer"
                : "bg-slate-950 border-slate-850 text-slate-600 cursor-not-allowed opacity-50"
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Swipeable & Scrollable Container */}
      <div className="relative group">
        <div
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x select-none cursor-grab active:cursor-grabbing scroll-smooth"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#334155 #0f172a" }}
        >
          {screenshots.map((ss, idx) => {
            const safeUrl = getSafeImageUrl(ss.image_url);

            return (
              <div
                key={ss.id}
                onClick={() => {
                  if (!hasDragged.current) {
                    setSelectedIdx(idx);
                  }
                }}
                className="group/item flex-shrink-0 w-64 sm:w-72 rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/90 shadow-xl snap-start relative hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
              >
                {/* Image */}
                <div className="relative aspect-[9/16] bg-slate-950 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={safeUrl}
                    alt={ss.caption || `Screenshot ${idx + 1}`}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300 pointer-events-none"
                    loading="lazy"
                  />

                  {/* Hover Overlay with Zoom Icon */}
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="p-3 rounded-full bg-slate-900/90 text-white shadow-lg border border-slate-700">
                      <Maximize2 className="w-5 h-5 text-blue-400" />
                    </span>
                  </div>
                </div>

                {ss.caption && (
                  <div className="p-3 text-xs text-slate-300 border-t border-slate-800 text-center font-medium truncate">
                    {ss.caption}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal (Fullscreen Zoom Preview) */}
      {selectedIdx !== null && screenshots[selectedIdx] && (
        <div
          onClick={() => setSelectedIdx(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedIdx(null)}
            className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            aria-label="Tutup Preview"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Prev Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIdx((prev) =>
                prev !== null && prev > 0 ? prev - 1 : screenshots.length - 1
              );
            }}
            className="absolute left-4 sm:left-8 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-xl transition-colors"
            aria-label="Foto Sebelumnya"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIdx((prev) =>
                prev !== null && prev < screenshots.length - 1 ? prev + 1 : 0
              );
            }}
            className="absolute right-4 sm:right-8 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-xl transition-colors"
            aria-label="Foto Selanjutnya"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Image & Caption */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getSafeImageUrl(screenshots[selectedIdx].image_url)}
              alt="Screenshot Preview"
              crossOrigin="anonymous"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-slate-800"
            />
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
              <span>
                {selectedIdx + 1} dari {screenshots.length}
              </span>
              {screenshots[selectedIdx].caption && (
                <>
                  <span>•</span>
                  <span className="text-white font-medium">
                    {screenshots[selectedIdx].caption}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
