"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { IgMediaType, IgPost } from "@/lib/instagram";

const CAPTION_MAX = 2200;
const MAX_WIDTH = 1440;
// Instagram feed images must sit between 4:5 (portrait) and 1.91:1 (landscape).
const MIN_RATIO = 4 / 5;
const MAX_RATIO = 1.91;

/**
 * Re-encode any raster image as an Instagram-ready JPEG: at most 1440px wide,
 * padded with white (Amorfos product shots are on white) to fit the allowed
 * aspect range, so a tall phone photo or a square PNG never gets rejected.
 */
async function toInstagramJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = bitmap.width / bitmap.height;
  let canvasW = bitmap.width;
  let canvasH = bitmap.height;
  if (ratio < MIN_RATIO) canvasW = Math.round(bitmap.height * MIN_RATIO); // too tall → pad sides
  if (ratio > MAX_RATIO) canvasH = Math.round(bitmap.width / MAX_RATIO); // too wide → pad top/bottom
  const scale = Math.min(1, MAX_WIDTH / canvasW);
  const w = Math.round(canvasW * scale);
  const h = Math.round(canvasH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  const dw = bitmap.width * scale;
  const dh = bitmap.height * scale;
  ctx.drawImage(bitmap, (w - dw) / 2, (h - dh) / 2, dw, dh);
  bitmap.close();

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("JPEG encode failed"))), "image/jpeg", 0.9),
  );
}

const igPage = "amorfos.in/ig";
const feedNo = (n: number) => `No. ${String(n).padStart(2, "0")}`;

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

const STATUS_STYLE: Record<IgPost["status"], string> = {
  queued: "text-ink-dim",
  processing: "text-gold-soft",
  published: "text-gold-deep",
  failed: "text-rudra",
};

export default function AdminInstagramClient({
  configured,
  connection,
  quota,
  posts,
  result,
  nextFeed,
}: {
  configured: boolean;
  connection: { username: string | null; expires_at: string } | null;
  quota: { used: number; total: number } | null;
  posts: IgPost[];
  result: string | null;
  nextFeed: number;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mediaType, setMediaType] = useState<IgMediaType>("IMAGE");
  const [urls, setUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [when, setWhen] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("Read the full guide");
  const [addLine, setAddLine] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const banner = (() => {
    if (!result) return null;
    if (result.startsWith("connected:")) return { ok: true, text: `Connected @${result.slice(10)}.` };
    if (result === "invalid_state") return { ok: false, text: "Connection link expired or was opened in another browser. Try Connect again." };
    if (result.startsWith("denied")) return { ok: false, text: "Instagram permission was not granted." };
    return { ok: false, text: "Connecting Instagram failed. Check the Vercel logs for [instagram]." };
  })();

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy("upload");
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const jpeg = await toInstagramJpeg(file);
        const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "Content-Type": "image/jpeg", "x-filename": `instagram-${name}` },
          body: jpeg,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed.");
        uploaded.push(data.url);
      }
      setUrls((prev) => [...prev, ...uploaded]);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function queuePost(e: React.FormEvent) {
    e.preventDefault();
    const media_urls = mediaType === "REELS" ? [videoUrl.trim()] : urls;
    setBusy("queue");
    try {
      const res = await fetch("/api/admin/instagram/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: mediaType,
          media_urls,
          caption,
          scheduled_for: when ? new Date(when).toISOString() : undefined,
          link_url: linkUrl.trim() || undefined,
          link_label: linkLabel.trim() || undefined,
          add_link_line: addLine,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not queue the post.");
      setUrls([]);
      setVideoUrl("");
      setCaption("");
      setWhen("");
      setLinkUrl("");
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function act(id: string, action: "publish" | "delete") {
    if (action === "publish" && !confirm("Publish this post to Instagram now? It goes live immediately.")) return;
    if (action === "delete" && !confirm("Remove this post from the queue?")) return;
    setBusy(id);
    try {
      const res = await fetch(
        action === "publish" ? `/api/admin/instagram/posts/${id}/publish` : `/api/admin/instagram/posts/${id}`,
        { method: action === "publish" ? "POST" : "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) alert(data.error ?? "Action failed.");
      else if (data.post?.status === "processing") alert("Instagram is still processing the video. The daily run will finish publishing it, or press Publish again in a minute.");
      router.refresh();
    } catch {
      alert("Network error.");
    } finally {
      setBusy(null);
    }
  }

  async function addComment(p: IgPost) {
    if (!confirm(`Post the link comment on ${p.feed_no ? feedNo(p.feed_no) : "this post"} now? It appears publicly under the post.`)) return;
    setBusy(p.id);
    try {
      const res = await fetch(`/api/admin/instagram/posts/${p.id}/comment`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) alert(data.error ?? "Could not post the comment.");
      router.refresh();
    } catch {
      alert("Network error.");
    } finally {
      setBusy(null);
    }
  }

  async function editLink(p: IgPost) {
    const url = prompt("Link for this post (amorfos.in path, e.g. /journal/some-article). Leave empty to remove.", p.link_url ?? "");
    if (url === null) return;
    const label = url.trim() ? prompt("Link label", p.link_label ?? "Read the full guide") : "";
    if (label === null) return;
    setBusy(p.id);
    try {
      const res = await fetch(`/api/admin/instagram/posts/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link_url: url, link_label: label }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error ?? "Could not save the link.");
      router.refresh();
    } catch {
      alert("Network error.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect Instagram? Queued posts will not publish until you reconnect.")) return;
    await fetch("/api/admin/instagram/disconnect", { method: "POST" });
    router.refresh();
  }

  const daysLeft = connection
    ? Math.max(0, Math.round((Date.parse(connection.expires_at) - Date.now()) / 86_400_000))
    : 0;
  const mediaReady = mediaType === "REELS" ? videoUrl.trim() !== "" : mediaType === "IMAGE" ? urls.length === 1 : urls.length >= 2;

  return (
    <div className="space-y-10">
      {banner && (
        <div className={`rounded-sm border px-4 py-3 text-sm ${banner.ok ? "border-gold/40 bg-gold/10 text-ink" : "border-rudra/40 bg-rudra/10 text-ink"}`}>
          {banner.text}
        </div>
      )}

      {/* Connection */}
      <section className="rounded-sm border border-line bg-paper p-5">
        <h2 className="mb-3 font-serif text-xl text-ink">Connection</h2>
        {connection ? (
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <div className="text-ink-dim">
              Connected as <strong className="text-ink">@{connection.username ?? "unknown"}</strong> ·{" "}
              {daysLeft > 18000 ? "token does not expire" : `token expires in ${daysLeft} days`}
              {quota && <> · {quota.used}/{quota.total} API posts used in the last 24h</>}
            </div>
            <div className="flex gap-3">
              <a href="/api/admin/instagram/connect" className="btn btn-outline text-sm">Reconnect</a>
              <button onClick={handleDisconnect} className="text-xs uppercase tracking-[0.18em] text-ink-faint hover:text-ink">
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-ink-dim">
            <span>Not connected. You&apos;ll log in with Facebook or Instagram, pick the Amorfos business and @amorfos.in, and allow posting.</span>
            {configured ? (
              <a href="/api/admin/instagram/connect" className="btn btn-primary text-sm">Connect Instagram</a>
            ) : (
              <span className="text-ink-faint">Configure the app first.</span>
            )}
          </div>
        )}
      </section>

      {/* New post */}
      <section className="rounded-sm border border-line bg-paper p-5">
        <h2 className="mb-1 font-serif text-xl text-ink">Queue a post</h2>
        <p className="mb-5 text-sm text-ink-faint">
          One due post publishes each day at 7 PM IST. Captions go through the same banned-phrase check as the journal.
        </p>
        <form onSubmit={queuePost} className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {(["IMAGE", "CAROUSEL", "REELS"] as IgMediaType[]).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setMediaType(t)}
                className={`rounded-sm border px-3 py-1.5 text-xs uppercase tracking-[0.16em] ${mediaType === t ? "border-gold bg-gold/10 text-ink" : "border-line text-ink-faint hover:text-ink"}`}
              >
                {t === "IMAGE" ? "Single image" : t === "CAROUSEL" ? "Carousel" : "Reel"}
              </button>
            ))}
          </div>

          {mediaType === "REELS" ? (
            <label className="block text-sm text-ink-dim">
              Public video URL (MP4/MOV, 9:16, 3s–15min)
              <input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://…/reel.mp4"
                className="mt-1 w-full rounded-sm border border-line bg-paper-raised px-3 py-2 text-ink"
              />
            </label>
          ) : (
            <div>
              <div className="flex flex-wrap gap-3">
                {urls.map((u, i) => (
                  <div key={u} className="relative h-24 w-24 overflow-hidden rounded-sm border border-line bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt={`Image ${i + 1}`} className="h-full w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setUrls(urls.filter((x) => x !== u))}
                      className="absolute right-1 top-1 rounded-full bg-ink/70 px-1.5 text-xs text-paper"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple={mediaType === "CAROUSEL"}
                onChange={handleFiles}
                className="mt-3 block text-sm text-ink-dim"
                disabled={busy === "upload" || (mediaType === "IMAGE" && urls.length >= 1)}
              />
              {busy === "upload" && <p className="mt-1 text-xs text-ink-faint">Converting and uploading…</p>}
            </div>
          )}

          <label className="block text-sm text-ink-dim">
            Caption
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={7}
              maxLength={CAPTION_MAX}
              placeholder={"The bead that steadies you.\n\nOne useful fact (mukhi / origin / certification).\n\nShop at amorfos.in 🪔\n\n#rudraksha #labcertified"}
              className="mt-1 w-full rounded-sm border border-line bg-paper-raised px-3 py-2 text-ink"
            />
            <span className="mt-1 block text-right text-xs text-ink-faint">{caption.length}/{CAPTION_MAX}</span>
          </label>

          <fieldset className="space-y-3 rounded-sm border border-line p-4">
            <legend className="px-1 text-xs uppercase tracking-[0.16em] text-ink-faint">Link (shown on {igPage})</legend>
            <label className="block text-sm text-ink-dim">
              Journal article or product on amorfos.in
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/journal/what-lab-certified-rudraksha-means  or  /shop/5-mukhi-nepal"
                className="mt-1 w-full rounded-sm border border-line bg-paper-raised px-3 py-2 text-ink"
              />
            </label>
            {linkUrl.trim() && (
              <>
                <label className="block text-sm text-ink-dim">
                  Label
                  <input
                    value={linkLabel}
                    onChange={(e) => setLinkLabel(e.target.value)}
                    className="mt-1 w-full rounded-sm border border-line bg-paper-raised px-3 py-2 text-ink"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-dim">
                  <input type="checkbox" checked={addLine} onChange={(e) => setAddLine(e.target.checked)} />
                  Add to caption: <span className="text-ink">{feedNo(nextFeed)} · {linkLabel || "Read more"} at {igPage}</span>
                </label>
                <p className="text-xs text-ink-faint">
                  On publish, the link is also posted as the first comment (Instagram doesn&apos;t make caption links clickable; the tappable path is the bio link → {igPage}).
                </p>
              </>
            )}
          </fieldset>

          <label className="block text-sm text-ink-dim">
            Publish on or after (IST, optional — blank means the next daily run)
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="mt-1 block rounded-sm border border-line bg-paper-raised px-3 py-2 text-ink"
            />
          </label>

          <button type="submit" className="btn btn-primary text-sm" disabled={!mediaReady || busy !== null}>
            {busy === "queue" ? "Checking…" : "Add to queue"}
          </button>
        </form>
      </section>

      {/* Queue */}
      <section>
        <h2 className="mb-3 font-serif text-xl text-ink">Posts</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-ink-faint">Nothing queued yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-left">
                  {["No.", "Media", "Caption", "Scheduled", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-normal uppercase tracking-[0.16em] text-ink-faint">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {posts.map((p) => (
                  <tr key={p.id} className="align-top hover:bg-paper/50">
                    <td className="whitespace-nowrap px-4 py-3 font-serif text-ink">{p.feed_no ? feedNo(p.feed_no) : "—"}</td>
                    <td className="px-4 py-3">
                      {p.media_type === "REELS" ? (
                        <span className="text-xs text-ink-faint">Reel</span>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.media_urls[0]} alt="" className="h-14 w-14 rounded-sm border border-line bg-white object-contain" />
                      )}
                      {p.media_type === "CAROUSEL" && <span className="mt-1 block text-xs text-ink-faint">+{p.media_urls.length - 1}</span>}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-ink-dim">
                      <p className="line-clamp-3 whitespace-pre-line">{p.caption || <em className="text-ink-faint">No caption</em>}</p>
                      {p.error && <p className="mt-1 text-xs text-rudra">{p.error}</p>}
                      <p className="mt-1 text-xs">
                        {p.link_url ? (
                          <a href={p.link_url} target="_blank" rel="noreferrer" className="text-gold-soft hover:underline">
                            🔗 {p.link_label ?? "Link"}: {p.link_url}
                          </a>
                        ) : (
                          <span className="text-ink-faint">No link</span>
                        )}
                        {p.comment_id && <span className="ml-2 text-ink-faint">· comment posted</span>}
                      </p>
                      {p.comment_error && <p className="mt-1 text-xs text-rudra">Link comment failed: {p.comment_error}</p>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-dim">{fmt(p.published_at ?? p.scheduled_for)}</td>
                    <td className={`px-4 py-3 capitalize ${STATUS_STYLE[p.status]}`}>
                      {p.permalink ? (
                        <a href={p.permalink} target="_blank" rel="noreferrer" className="hover:underline">{p.status} ↗</a>
                      ) : (
                        p.status
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {p.status !== "published" && (
                        <button
                          onClick={() => act(p.id, "publish")}
                          disabled={busy === p.id || !connection}
                          className="mr-3 text-xs uppercase tracking-[0.16em] text-gold-soft hover:underline disabled:opacity-40"
                        >
                          {busy === p.id ? "Publishing…" : p.status === "failed" ? "Retry" : "Publish now"}
                        </button>
                      )}
                      {p.status === "published" && p.link_url && !p.comment_id && (
                        <button
                          onClick={() => addComment(p)}
                          disabled={busy === p.id || !connection}
                          className="mr-3 text-xs uppercase tracking-[0.16em] text-gold-soft hover:underline disabled:opacity-40"
                        >
                          Add link comment
                        </button>
                      )}
                      <button
                        onClick={() => editLink(p)}
                        disabled={busy === p.id}
                        className="mr-3 text-xs uppercase tracking-[0.16em] text-ink-faint hover:text-ink"
                      >
                        Link
                      </button>
                      <button
                        onClick={() => act(p.id, "delete")}
                        disabled={busy === p.id}
                        className="text-xs uppercase tracking-[0.16em] text-ink-faint hover:text-ink"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
