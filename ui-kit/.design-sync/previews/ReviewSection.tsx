import { ReviewSection } from "@amorfos/ui-kit";

const REVIEWS = [
  {
    id: "1",
    rating: 5,
    title: "Absolutely authentic, beautifully crafted",
    body: "I've been wearing this for three months and the quality is exceptional. The silver work is delicate but sturdy. My astrologer recommended the 7 Mukhi specifically for my chart.",
    reviewer: "Priya S.",
    review_date: "2026-03-15",
    verified: true,
  },
  {
    id: "2",
    rating: 5,
    title: "Exceeded expectations",
    body: "Fast delivery, gorgeous packaging. The certification card adds so much credibility. Will definitely order again.",
    reviewer: "Rajesh M.",
    review_date: "2026-02-28",
    verified: true,
  },
  {
    id: "3",
    rating: 4,
    title: "Good quality, slight delay",
    body: "The bead itself is beautiful and the lab certificate is reassuring. Shipping took a few extra days but the product made up for it.",
    reviewer: "Ananya K.",
    review_date: "2026-01-20",
    verified: false,
  },
  {
    id: "4",
    rating: 5,
    body: "Wearing it for a month, feel calmer. Beautiful piece.",
    reviewer: "Vikram T.",
    review_date: "2026-04-02",
    verified: true,
  },
];

const SUMMARY = {
  average: 4.7,
  total: 4,
  distribution: { 5: 3, 4: 1, 3: 0, 2: 0, 1: 0 } as Record<1 | 2 | 3 | 4 | 5, number>,
};

export function Default() {
  return (
    <div style={{ maxWidth: "680px", padding: "0 1rem" }}>
      <ReviewSection reviews={REVIEWS} summary={SUMMARY} />
    </div>
  );
}

export function ManyReviews() {
  const moreReviews = [
    ...REVIEWS,
    { id: "5", rating: 5, body: "Gifted this to my father. He loves it.", reviewer: "Divya R.", review_date: "2026-05-01", verified: true },
    { id: "6", rating: 4, body: "Good product. Authentic feel.", reviewer: "Suresh P.", review_date: "2026-04-20", verified: false },
    { id: "7", rating: 5, title: "Life-changing piece", body: "My pandit recommended this. The quality is unmatched.", reviewer: "Meera B.", review_date: "2026-03-05", verified: true },
  ];
  const bigSummary = { average: 4.7, total: 7, distribution: { 5: 6, 4: 1, 3: 0, 2: 0, 1: 0 } as Record<1 | 2 | 3 | 4 | 5, number> };
  return (
    <div style={{ maxWidth: "680px", padding: "0 1rem" }}>
      <ReviewSection reviews={moreReviews} summary={bigSummary} pageSize={3} />
    </div>
  );
}
