export interface ArticleCardArticle {
  slug: string;
  h1: string;
  heroImage?: string | null;
  cluster?: string;
  published_at?: string | null;
  excerpt?: string | null;
  href?: string;
}

export interface ArticleCardProps {
  article: ArticleCardArticle;
  clusterLabels?: Record<string, string>;
}

const FALLBACK_HERO = "/products/pendant-7-mukhi-1.jpg";

const DEFAULT_CLUSTER_LABELS: Record<string, string> = {
  rudraksha: "Rudraksha Guide",
  spiritual: "Spiritual Living",
  astrology: "Astrology",
  wellness: "Wellness",
};

export function ArticleCard({ article, clusterLabels = DEFAULT_CLUSTER_LABELS }: ArticleCardProps) {
  const href = article.href ?? `/journal/${article.slug}`;
  const clusterLabel = article.cluster ? (clusterLabels[article.cluster] ?? article.cluster) : null;

  return (
    <a
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        color: "inherit",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Hero image */}
      <div
        style={{
          position: "relative",
          aspectRatio: "4/3",
          overflow: "hidden",
          borderRadius: "2px",
          background: "#FDFBF7",
        }}
      >
        <img
          src={article.heroImage || FALLBACK_HERO}
          alt={article.h1}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.7s" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1.05)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1)")}
        />
      </div>

      {/* Meta */}
      <div style={{ marginTop: "0.875rem", display: "flex", flexDirection: "column", gap: "6px" }}>
        {clusterLabel && (
          <span
            style={{
              fontSize: "0.6rem",
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              color: "var(--color-gold)",
              fontFamily: "var(--font-sans)",
              fontWeight: 500,
            }}
          >
            {clusterLabel}
          </span>
        )}
        <h3
          style={{
            margin: 0,
            fontFamily: "var(--font-serif)",
            fontSize: "1.2rem",
            fontWeight: 500,
            lineHeight: 1.25,
            color: "var(--color-ink)",
          }}
        >
          {article.h1}
        </h3>
        {article.excerpt && (
          <p
            style={{
              margin: 0,
              fontSize: "0.83rem",
              lineHeight: 1.6,
              color: "var(--color-ink-dim)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {article.excerpt}
          </p>
        )}
        {article.published_at && (
          <span style={{ fontSize: "0.7rem", color: "var(--color-ink-faint)" }}>
            {new Date(article.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )}
      </div>
    </a>
  );
}
