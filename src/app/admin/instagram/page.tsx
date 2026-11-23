import Link from "next/link";
import AdminLogoutButton from "../products/AdminLogoutButton";
import AdminInstagramClient from "./AdminInstagramClient";
import {
  getConnection,
  isInstagramConfigured,
  listPosts,
  publishingQuota,
  type IgPost,
} from "@/lib/instagram";
import { isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const metadata = { title: "Instagram" };

export default async function AdminInstagramPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const { result } = await searchParams;
  const configured = isInstagramConfigured();
  const dbReady = isSupabaseConfigured();

  let connection: { username: string | null; expires_at: string } | null = null;
  let posts: IgPost[] = [];
  let quota: { used: number; total: number } | null = null;
  let loadError: string | null = null;
  if (dbReady) {
    try {
      const conn = await getConnection();
      if (conn) {
        connection = { username: conn.username, expires_at: conn.expires_at };
        quota = await publishingQuota(conn);
      }
      posts = await listPosts();
    } catch (err) {
      loadError = (err as Error).message;
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-1">Admin</p>
          <h1 className="font-serif text-3xl text-ink">Instagram</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="text-sm text-gold-soft hover:underline">Products</Link>
          <Link href="/admin/orders" className="text-sm text-gold-soft hover:underline">Orders</Link>
          <Link href="/admin/journal" className="text-sm text-gold-soft hover:underline">Journal</Link>
          <AdminLogoutButton />
        </div>
      </div>

      {!configured && (
        <div className="mb-6 rounded-sm border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink-dim">
          <strong className="text-ink">Instagram app not configured.</strong> Set{" "}
          <code className="font-mono text-gold-soft">INSTAGRAM_APP_ID</code> and{" "}
          <code className="font-mono text-gold-soft">INSTAGRAM_APP_SECRET</code> and{" "}
          <code className="font-mono text-gold-soft">INSTAGRAM_CONFIG_ID</code> in Vercel, then redeploy.
        </div>
      )}
      {loadError && (
        <div className="mb-6 rounded-sm border border-rudra/40 bg-rudra/10 px-4 py-3 text-sm text-ink-dim">
          <strong className="text-ink">Could not load Instagram data:</strong> {loadError}
          <span className="block text-ink-faint">Has migration 009 been applied?</span>
        </div>
      )}

      <AdminInstagramClient
        configured={configured}
        connection={connection}
        quota={quota}
        posts={posts}
        result={result ?? null}
      />
    </div>
  );
}
