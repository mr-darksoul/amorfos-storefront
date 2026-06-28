import { ArticleCard } from "@amorfos/ui-kit";

const ARTICLE_1 = {
  slug: "7-mukhi-rudraksha-benefits",
  h1: "7 Mukhi Rudraksha: Benefits, Who Should Wear & How to Energise",
  heroImage: "/products/pendant-7-mukhi-1.jpg",
  cluster: "rudraksha",
  published_at: "2026-05-15",
  excerpt: "The 7 Mukhi Rudraksha is ruled by Mahalakshmi and is said to bring prosperity and remove obstacles. Here is everything your pandit may have told you — and what the texts say.",
};

const ARTICLE_2 = {
  slug: "rudraksha-mala-japa",
  h1: "How to Use a Rudraksha Mala for Japa Meditation",
  heroImage: "/products/mala-5-mukhi-1.jpg",
  cluster: "spiritual",
  published_at: "2026-04-20",
  excerpt: "A step-by-step guide to japa using a 108-bead Rudraksha mala, from setting intention to proper bead handling.",
};

const ARTICLE_3 = {
  slug: "lab-certification-guide",
  h1: "What Does a Rudraksha Lab Certificate Actually Tell You?",
  heroImage: null,
  cluster: "rudraksha",
  published_at: "2026-03-10",
  excerpt: "Breaking down what X-ray diffraction, mukhis count, and specific gravity tests actually verify.",
};

export function Single() {
  return (
    <div style={{ maxWidth: "320px" }}>
      <ArticleCard article={ARTICLE_1} />
    </div>
  );
}

export function Grid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", maxWidth: "900px" }}>
      <ArticleCard article={ARTICLE_1} />
      <ArticleCard article={ARTICLE_2} />
      <ArticleCard article={ARTICLE_3} />
    </div>
  );
}
