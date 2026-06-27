"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MAX_SCALE = 4;
const MIN_SCALE = 1;
const DOUBLE_TAP_SCALE = 2.5;

type Point = { x: number; y: number };

export default function ImageLightbox({
  images,
  name,
  index,
  open,
  onClose,
  onIndexChange,
}: {
  images: string[];
  name: string;
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const [i, setI] = useState(index);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });
  const closeRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Active pointers for pan / pinch
  const pointers = useRef<Map<number, Point>>(new Map());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const panStart = useRef<{ pointer: Point; translate: Point } | null>(null);
  // Tracks pointer-down position to distinguish a tap (toggle zoom) from a drag.
  const downPos = useRef<Point | null>(null);

  const reset = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  // Sync internal index when reopened at a different image
  useEffect(() => {
    if (open) {
      setI(index);
      reset();
    }
  }, [open, index, reset]);

  const go = useCallback(
    (next: number) => {
      const len = images.length;
      const n = ((next % len) + len) % len;
      setI(n);
      onIndexChange(n);
      reset();
    },
    [images.length, onIndexChange, reset]
  );

  // Body scroll lock + focus management + Esc / arrows
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && images.length > 1) go(i + 1);
      else if (e.key === "ArrowLeft" && images.length > 1) go(i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, go, i, images.length]);

  if (!open) return null;

  const clampTranslate = (t: Point, s: number): Point => {
    const stage = stageRef.current;
    if (!stage) return t;
    const { width, height } = stage.getBoundingClientRect();
    // Allow panning across the part of the image that overflows the stage.
    const maxX = (width * (s - 1)) / 2;
    const maxY = (height * (s - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, t.x)),
      y: Math.max(-maxY, Math.min(maxY, t.y)),
    };
  };

  const dist = (a: Point, b: Point) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      pinchStart.current = { dist: dist(pts[0], pts[1]), scale };
      panStart.current = null;
    } else if (pts.length === 1 && scale > 1) {
      panStart.current = { pointer: pts[0], translate };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];

    if (pts.length === 2 && pinchStart.current) {
      const ratio = dist(pts[0], pts[1]) / pinchStart.current.dist;
      const next = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, pinchStart.current.scale * ratio)
      );
      setScale(next);
      setTranslate((t) => clampTranslate(t, next));
    } else if (pts.length === 1 && panStart.current && scale > 1) {
      const p = pts[0];
      const next = {
        x: panStart.current.translate.x + (p.x - panStart.current.pointer.x),
        y: panStart.current.translate.y + (p.y - panStart.current.pointer.y),
      };
      setTranslate(clampTranslate(next, scale));
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) panStart.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    const next = Math.max(
      MIN_SCALE,
      Math.min(MAX_SCALE, scale - e.deltaY * 0.002)
    );
    setScale(next);
    setTranslate((t) => clampTranslate(t, next));
  };

  // Click toggles zoom — but only treat it as a click if the pointer didn't pan.
  const onImgPointerDown = (e: React.PointerEvent) => {
    downPos.current = { x: e.clientX, y: e.clientY };
  };
  const onImgClick = (e: React.PointerEvent) => {
    if (!downPos.current) return;
    const moved = dist(downPos.current, { x: e.clientX, y: e.clientY });
    downPos.current = null;
    if (moved > 6) return; // was a drag, not a tap
    if (scale > 1) reset();
    else setScale(DOUBLE_TAP_SCALE);
  };

  // Portal to <body> so the overlay escapes the gallery's stacking context
  // and renders above the sticky site header (z-50).
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name} — image viewer`}
      className="fixed inset-0 z-[100] flex flex-col bg-dark/95 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close */}
      <button
        ref={closeRef}
        onClick={onClose}
        aria-label="Close image viewer"
        className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-cream/10 text-cream ring-1 ring-cream/20 transition hover:bg-gold hover:text-paper"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute left-4 top-5 z-10 text-xs uppercase tracking-[0.18em] text-cream/70">
          {i + 1} / {images.length}
        </div>
      )}

      {/* Stage */}
      <div
        ref={stageRef}
        className="relative flex-1 touch-none select-none overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onWheel={onWheel}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transition: pointers.current.size ? "none" : "transform 0.2s ease-out",
            cursor: scale > 1 ? "grab" : "zoom-in",
          }}
          onPointerDown={onImgPointerDown}
          onPointerUp={onImgClick}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[i]}
            alt={name}
            draggable={false}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        {/* Prev / Next */}
        {images.length > 1 && (
          <>
            <ArrowButton side="left" onClick={() => go(i - 1)} />
            <ArrowButton side="right" onClick={() => go(i + 1)} />
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex shrink-0 items-center justify-center gap-2 p-4">
          {images.map((src, idx) => (
            <button
              key={src}
              onClick={() => go(idx)}
              aria-label={`View image ${idx + 1}`}
              className={`relative size-14 shrink-0 overflow-hidden rounded-sm bg-white transition ${
                idx === i ? "ring-2 ring-gold" : "ring-1 ring-cream/20 opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill sizes="56px" className="object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}

function ArrowButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={`absolute top-1/2 -translate-y-1/2 ${
        side === "left" ? "left-4" : "right-4"
      } flex size-11 items-center justify-center rounded-full bg-cream/10 text-cream ring-1 ring-cream/20 transition hover:bg-gold hover:text-paper`}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path
          d={side === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
