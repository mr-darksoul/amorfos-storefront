import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/types";
import { CLUSTER_LABELS } from "@/lib/articles";

/** Fallback hero when an article has no heroImage of its own. */
const FALLBACK_HERO = "/products/pendant-7-mukhi-1.jpg";

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <Link href={`/journal/${article.slug}`} className="group flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-[#FDFBF7]">
        <Image
          src={article.heroImage || FALLBACK_HERO}
          alt={article.h1}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <p className="mt-4 text-[0.68rem] uppercase tracking-[0.2em] text-ink-faint">
        {CLUSTER_LABELS[article.cluster]}
        {article.readingMinutes ? ` · ${article.readingMinutes} min read` : ""}
      </p>
      <h3 className="mt-1.5 font-serif text-xl leading-snug text-ink transition-colors group-hover:text-gold-soft">
        {article.h1}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-dim line-clamp-3">
        {article.excerpt}
      </p>
    </Link>
  );
}
