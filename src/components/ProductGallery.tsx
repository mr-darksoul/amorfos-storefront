"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);

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

      <div className="relative flex-1 aspect-square overflow-hidden rounded-sm bg-white">
        {images[active] ? (
          <Image
            src={images[active]}
            alt={name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 45vw"
            className="object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl text-stone-200 font-serif">
            ✦
          </div>
        )}
        <div className="absolute inset-0 rounded-sm ring-1 ring-inset ring-black/5" />
      </div>
    </div>
  );
}
