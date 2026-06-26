"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ImageLightbox from "./ImageLightbox";

const ZOOM = 2.5;

export default function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [canHover, setCanHover] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanHover(
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
    );
  }, []);

  const handleMove = (e: React.MouseEvent) => {
    const el = frameRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  };

  const hasImage = Boolean(images[active]);

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      {images.length > 1 && (
        <div className="flex gap-3 sm:flex-col">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={`relative size-16 shrink-0 overflow-hidden rounded-sm bg-white sm:size-20 ${
                active === i ? "ring-2 ring-gold" : "ring-1 ring-line"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-contain" />
            </button>
          ))}
        </div>
      )}

      <div
        ref={frameRef}
        role={hasImage ? "button" : undefined}
        tabIndex={hasImage ? 0 : undefined}
        aria-label={hasImage ? `Zoom ${name}` : undefined}
        onClick={() => hasImage && setLightboxOpen(true)}
        onKeyDown={(e) => {
          if (hasImage && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setLightboxOpen(true);
          }
        }}
        onMouseEnter={() => canHover && setZooming(true)}
        onMouseMove={canHover ? handleMove : undefined}
        onMouseLeave={() => setZooming(false)}
        className={`group relative aspect-square flex-1 overflow-hidden rounded-sm bg-white ${
          hasImage ? "cursor-zoom-in" : ""
        }`}
      >
        {hasImage ? (
          <>
            <Image
              src={images[active]}
              alt={name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-contain"
            />

            {/* In-place magnify layer (desktop hover) */}
            {canHover && zooming && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[active]}
                alt=""
                aria-hidden
                draggable={false}
                className="pointer-events-none absolute inset-0 size-full object-contain"
                style={{
                  transform: `scale(${ZOOM})`,
                  transformOrigin: `${pos.x}% ${pos.y}%`,
                }}
              />
            )}

            {/* Zoom hint */}
            <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-dark/55 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.14em] text-cream opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
              <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4-4M11 8v6M8 11h6" strokeLinecap="round" />
              </svg>
              Click to zoom
            </span>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl text-stone-200 font-serif">
            ✦
          </div>
        )}
        <div className="absolute inset-0 rounded-sm ring-1 ring-inset ring-black/5" />
      </div>

      <ImageLightbox
        images={images}
        name={name}
        index={active}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setActive}
      />
    </div>
  );
}
