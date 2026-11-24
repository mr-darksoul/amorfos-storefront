import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPublishedArticles } from "@/lib/articles";
import { getAdminProduct } from "@/lib/adminProducts";
import { feedLabel, listFeedPosts, trackedLink, type IgPost } from "@/lib/instagram";
import { isSupabaseConfigured } from "@/lib/supabase";
import { site } from "@/lib/site";

// "From the feed" — the Instagram bio link. Instagram doesn't make links in
// captions clickable, so every post carries a number ("No. 07") and this page
// maps each number to the journal article or bead it is about.
export const revalidate = 300;

const INSTAGRAM_HANDLE = "amorfos.in";
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

export const metadata: Metadata = {
  title: "From the feed",
  description:
    "Every Amorfos Instagram post, numbered — tap the one you saw to read the guide or see the bead.",
  alternates: { canonical: "/ig" },
  // A navigation page for Instagram visitors, not a search landing page.
  robots: { index: false, follow: true },
};

interface Tile {
  post: IgPost;
  title: string;
  href: string;
  external: boolean;
  kind: string;
  image: string | null;
}

/** First non-empty caption line, as a fallback title. */
function captionTitle(caption: string): string {
  const line = caption.split("\n").map((l) => l.trim()).find(Boolean) ?? "";
  return line.length > 90 ? `${line.slice(0, 87)}…` : line;
}

async function buildTiles(posts: IgPost[]): Promise<Tile[]> {
  const articles = await getPublishedArticles().catch(() => []);
  const articleTitle = new Map(articles.map((a) => [a.slug, a.h1]));

  return Promise.all(
    posts.map(async (post): Promise<Tile> => {
      const path = post.link_url;
      let title = "";
      let kind = "Post";
      if (path?.startsWith("/journal/")) {
        kind = "Journal";
        title = articleTitle.get(path.slice("/journal/".length)) ?? "";
      } else if (path?.startsWith("/shop/")) {
        kind = "The bead";
        const product = await getAdminProduct(path.slice("/shop/".length)).catch(() => undefined);
        title = product?.name.replace(/^Amorfos®\s*/, "") ?? "";
      } else if (path?.startsWith("/collections/")) {
        kind = "Collection";
      } else if (path) {
        kind = "Amorfos";
      }
      return {
        post,
        title: title || captionTitle(post.caption) || "Amorfos",
        href: path ? trackedLink(path, post.feed_no) : (post.permalink ?? INSTAGRAM_URL),
        external: !path,
        kind,
        image: post.media_type === "REELS" ? null : (post.media_urls[0] ?? null),
      };
    }),
  );
}

export default async function FromTheFeedPage() {
  const posts = isSupabaseConfigured() ? await listFeedPosts().catch(() => []) : [];
  const tiles = await buildTiles(posts);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 md:py-16">
      <div className="mb-10 border-b border-line pb-8 text-center">
        <p className="eyebrow mb-3">@{INSTAGRAM_HANDLE}</p>
        <h1 className="display text-4xl sm:text-5xl">From the feed</h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-ink-dim">
          Every post carries a number. Find the one you saw and tap through to the
          full guide or the bead itself.
        </p>
      </div>

      {tiles.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-serif text-2xl text-ink-dim">The first posts are on their way.</p>
          <Link href="/journal" className="btn btn-outline mt-6">
            Read the Journal
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6">
          {tiles.map(({ post, title, href, external, kind, image }) => (
            <li key={post.id}>
              <a
                href={href}
                {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                className="group block"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-line bg-paper-raised">
                  {image ? (
                    <Image
                      src={image}
                      alt={title}
                      fill
                      sizes="(min-width: 640px) 300px, 45vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-faint">
                      <span aria-hidden className="text-3xl">▶</span>
                      <span className="text-xs uppercase tracking-[0.18em]">Reel</span>
                    </div>
                  )}
                  {post.feed_no && (
                    <span className="absolute left-2 top-2 rounded-sm bg-paper/90 px-2 py-1 font-serif text-sm text-ink">
                      {feedLabel(post.feed_no)}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-[0.65rem] uppercase tracking-[0.18em] text-gold-soft">{kind}</p>
                <p className="mt-1 font-serif text-lg leading-snug text-ink group-hover:text-gold-deep">
                  {title}
                </p>
                <p className="mt-1 text-xs text-ink-faint">
                  {post.link_label ?? "View on Instagram"} →
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-16 flex flex-col items-center gap-3 border-t border-line pt-10 text-center">
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="btn btn-outline">
          Follow @{INSTAGRAM_HANDLE}
        </a>
        <Link href="/shop" className="text-sm text-gold-soft hover:underline">
          Or browse the full collection at {site.url.replace(/^https?:\/\//, "")}
        </Link>
      </div>
    </div>
  );
}
