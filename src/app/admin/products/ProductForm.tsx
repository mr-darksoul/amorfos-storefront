"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Product, Category, Origin, Bead, BeadOrigin } from "@/lib/types";
import { mukhiFacts } from "@/lib/mukhi";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "pendant", label: "Pendant" },
  { value: "mala", label: "Mala" },
  { value: "combination", label: "Combination Pendant" },
  { value: "loose", label: "Loose Bead" },
];

const CATEGORY_LABELS: Record<Category, string> = {
  pendant: "Pendant",
  mala: "Mala",
  combination: "Combination Pendant",
  loose: "Loose Bead",
};

const ORIGINS: Origin[] = ["Nepal", "Indonesia", "India", "Mixed"];
const BEAD_ORIGINS: BeadOrigin[] = ["Nepal", "Indonesia", "India"];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const EMPTY: Omit<Product, "id"> = {
  name: "",
  category: "pendant",
  categoryLabel: "Pendant",
  mukhi: 5,
  mukhiLabel: "",
  origin: "Nepal",
  beadSize: "",
  deity: "",
  planet: "",
  price: 0,
  mrp: 0,
  images: [""],
  tagline: "",
  description: "",
  benefits: [""],
  bestseller: false,
  newArrival: false,
  stock: null, // untracked by default (always available)
};

interface Props {
  initial?: Product;
  mode: "new" | "edit";
}

const inputCls =
  "w-full rounded-sm border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-gold-soft";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-ink-faint">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

export default function ProductForm({ initial, mode }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<Omit<Product, "id">>(
    initial
      ? { ...initial }
      : EMPTY,
  );
  const [id, setId] = useState(initial?.id ?? "");
  const [idManual, setIdManual] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  // Which field is currently generating ("all" | "tagline" | ... | "beadNote:<i>").
  const [genField, setGenField] = useState<string | null>(null);
  const [genError, setGenError] = useState("");
  // Last deity/planet we auto-filled from the mukhi table — lets us overwrite
  // our own auto value on a mukhi change while leaving a manual edit untouched.
  const autoFacts = useRef<{ deity: string; planet: string } | null>(
    initial ? mukhiFacts(initial.mukhi) : null,
  );

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleNameChange(name: string) {
    set("name", name);
    if (!idManual) setId(slugify(name));
  }

  function handleCategoryChange(cat: Category) {
    set("category", cat);
    set("categoryLabel", CATEGORY_LABELS[cat]);
  }

  // Deity/planet are factual per-mukhi. Auto-fill them on a mukhi change, but
  // only overwrite when the field is empty or still holds our last auto value —
  // a manual edit sticks.
  function handleMukhiChange(raw: string) {
    const mukhi = raw === "" ? null : Number(raw);
    const facts = mukhiFacts(mukhi);
    const prev = autoFacts.current;
    setForm((f) => {
      const next = { ...f, mukhi };
      if (facts) {
        if (!f.deity || f.deity === prev?.deity) next.deity = facts.deity;
        if (!f.planet || f.planet === prev?.planet) next.planet = facts.planet;
      }
      return next;
    });
    autoFacts.current = facts;
  }

  // Ask the API to generate copy for one field (or "all"), then merge the
  // result into the form. The admin still reviews/edits before saving.
  async function generate(field: string, beadIndex?: number) {
    setGenError("");
    setGenField(field === "beadNote" ? `beadNote:${beadIndex}` : field);
    try {
      const res = await fetch("/api/admin/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field,
          beadIndex,
          product: {
            name: form.name,
            category: form.category,
            categoryLabel: form.categoryLabel,
            mukhi: form.mukhi === null ? null : Number(form.mukhi),
            mukhiLabel: form.mukhiLabel,
            origin: form.origin,
            beads: form.beads,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error ?? "Generation failed.");
        return;
      }
      if (typeof data.tagline === "string") set("tagline", data.tagline);
      if (typeof data.description === "string") set("description", data.description);
      if (Array.isArray(data.benefits) && data.benefits.length)
        set("benefits", data.benefits);
      if (typeof data.deity === "string" && data.deity) set("deity", data.deity);
      if (typeof data.planet === "string" && data.planet) set("planet", data.planet);
      if (field === "beadNote" && typeof beadIndex === "number" && typeof data.note === "string")
        handleBead(beadIndex, { note: data.note });
      if (Array.isArray(data.beadNotes) && (form.beads?.length ?? 0) > 0)
        applyBeads(
          (form.beads ?? []).map((b, i) =>
            typeof data.beadNotes[i] === "string" ? { ...b, note: data.beadNotes[i] } : b,
          ),
        );
    } catch {
      setGenError("Network error.");
    } finally {
      setGenField(null);
    }
  }

  // Small "generate" affordance reused across fields.
  function GenBtn({ field, beadIndex, label }: { field: string; beadIndex?: number; label?: string }) {
    const key = field === "beadNote" ? `beadNote:${beadIndex}` : field;
    return (
      <button
        type="button"
        onClick={() => generate(field, beadIndex)}
        disabled={genField !== null || !form.name.trim()}
        title={!form.name.trim() ? "Enter a product name first" : "Generate with AI"}
        className="text-xs text-gold-soft hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
      >
        {genField === key ? "Generating…" : (label ?? "✨ Generate")}
      </button>
    );
  }

  function handleBenefit(i: number, value: string) {
    const next = [...form.benefits];
    next[i] = value;
    set("benefits", next);
  }

  function addBenefit() {
    set("benefits", [...form.benefits, ""]);
  }

  function removeBenefit(i: number) {
    set("benefits", form.benefits.filter((_, idx) => idx !== i));
  }

  function handleImage(i: number, value: string) {
    const next = [...form.images];
    next[i] = value;
    set("images", next);
  }

  function addImage() {
    set("images", [...form.images, ""]);
  }

  function removeImage(i: number) {
    set("images", form.images.filter((_, idx) => idx !== i));
  }

  // ── Beads (combination composition) ──────────────────────────────
  // Whenever the bead list changes we re-derive the top-level origin:
  //   0 beads → leave the manually chosen origin alone
  //   1 distinct bead origin → that origin
  //   >1 distinct bead origins → "Mixed"
  // The origin <select> stays enabled so the admin can still override.
  function applyBeads(beads: Bead[]) {
    setForm((f) => {
      const distinct = [
        ...new Set(beads.map((b) => b.origin).filter(Boolean)),
      ];
      const origin: Origin =
        distinct.length === 0
          ? f.origin
          : distinct.length === 1
            ? distinct[0]
            : "Mixed";
      return { ...f, beads, origin };
    });
  }

  function handleBead(i: number, patch: Partial<Bead>) {
    const next = [...(form.beads ?? [])];
    next[i] = { ...next[i], ...patch };
    applyBeads(next);
  }

  function addBead() {
    applyBeads([...(form.beads ?? []), { mukhi: 0, origin: "Nepal", note: "" }]);
  }

  function removeBead(i: number) {
    applyBeads((form.beads ?? []).filter((_, idx) => idx !== i));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: {
          "Content-Type": file.type,
          "x-filename": file.name,
        },
        body: file,
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Upload failed.");
        return;
      }
      set("images", [...form.images.filter(Boolean), data.url]);
    } catch {
      alert("Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!id.trim()) { setError("Product ID is required."); return; }
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (form.price <= 0) { setError("Price must be greater than 0."); return; }
    if (form.mrp < form.price) { setError("MRP must be ≥ price."); return; }
    if (form.benefits.every((b) => !b.trim())) { setError("Add at least one benefit."); return; }

    // Keep only fully-specified beads; drop the field entirely when empty so
    // old single-bead products stay clean in the JSON blob.
    const beads = (form.beads ?? [])
      .filter((b) => b.mukhi)
      .map((b) => ({
        mukhi: Number(b.mukhi),
        origin: b.origin,
        ...(b.note?.trim() ? { note: b.note.trim() } : {}),
      }));

    const product: Product = {
      ...form,
      id: id.trim(),
      images: form.images.filter(Boolean),
      benefits: form.benefits.filter(Boolean),
      mukhi: form.mukhi === null ? null : Number(form.mukhi),
      price: Number(form.price),
      mrp: Number(form.mrp),
      ...(beads.length ? { beads } : { beads: undefined }),
    };

    setSaving(true);
    try {
      const url =
        mode === "new"
          ? "/api/admin/products"
          : `/api/admin/products/${initial!.id}`;
      const method = mode === "new" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Save failed.");
      } else {
        router.push("/admin/products");
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Identification */}
      <section className="space-y-4 rounded-sm border border-line bg-paper p-5">
        <h2 className="text-xs uppercase tracking-[0.18em] text-ink-faint">Identification</h2>

        <Field label="Product name *">
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className={inputCls}
            required
          />
        </Field>

        <Field
          label="Product ID (URL slug) *"
          hint={mode === "new" ? "Auto-generated from name. Edit to customise." : "Read-only in edit mode — changing it would break existing URLs."}
        >
          <input
            type="text"
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setIdManual(true);
            }}
            readOnly={mode === "edit"}
            className={`${inputCls} ${mode === "edit" ? "cursor-not-allowed opacity-60" : ""}`}
          />
        </Field>
      </section>

      {/* Classification */}
      <section className="space-y-4 rounded-sm border border-line bg-paper p-5">
        <h2 className="text-xs uppercase tracking-[0.18em] text-ink-faint">Classification</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category *">
            <select
              value={form.category}
              onChange={(e) => handleCategoryChange(e.target.value as Category)}
              className={inputCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Category label" hint="Shown on cards and PDP.">
            <input
              type="text"
              value={form.categoryLabel}
              onChange={(e) => set("categoryLabel", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Origin *">
            <select
              value={form.origin}
              onChange={(e) => set("origin", e.target.value as Origin)}
              className={inputCls}
            >
              {ORIGINS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Bead size" hint='e.g. "18–22 mm"'>
            <input
              type="text"
              value={form.beadSize}
              onChange={(e) => set("beadSize", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Mukhi" hint='Leave blank or set to 0 for N/A (e.g., Gauri Shankar).'>
            <input
              type="number"
              value={form.mukhi ?? ""}
              onChange={(e) => handleMukhiChange(e.target.value)}
              min={0}
              max={21}
              className={inputCls}
            />
          </Field>

          <Field label="Mukhi label" hint='e.g. "5 Mukhi (Five Faced)"'>
            <input
              type="text"
              value={form.mukhiLabel}
              onChange={(e) => set("mukhiLabel", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Ruling deity">
            <input
              type="text"
              value={form.deity}
              onChange={(e) => set("deity", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Ruling planet">
            <input
              type="text"
              value={form.planet}
              onChange={(e) => set("planet", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
      </section>

      {/* Pricing */}
      <section className="space-y-4 rounded-sm border border-line bg-paper p-5">
        <h2 className="text-xs uppercase tracking-[0.18em] text-ink-faint">Pricing (₹)</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Selling price *">
            <input
              type="number"
              value={form.price}
              onChange={(e) => set("price", Number(e.target.value))}
              min={1}
              className={inputCls}
              required
            />
          </Field>

          <Field label="MRP (struck-through) *">
            <input
              type="number"
              value={form.mrp}
              onChange={(e) => set("mrp", Number(e.target.value))}
              min={1}
              className={inputCls}
              required
            />
          </Field>
        </div>

        <Field
          label="Stock"
          hint="Leave blank for untracked (always available). Set a number to track inventory — 0 shows the product as Sold out and blocks checkout."
        >
          <input
            type="number"
            value={form.stock ?? ""}
            onChange={(e) =>
              set("stock", e.target.value === "" ? null : Number(e.target.value))
            }
            min={0}
            placeholder="Untracked"
            className={inputCls}
          />
        </Field>
      </section>

      {/* Images */}
      <section className="space-y-4 rounded-sm border border-line bg-paper p-5">
        <h2 className="text-xs uppercase tracking-[0.18em] text-ink-faint">Images</h2>
        <p className="text-xs text-ink-faint">
          Use <code className="font-mono">/products/image.jpg</code> for files in public/, or upload directly to Vercel Blob below.
        </p>

        {form.images.map((img, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={img}
              onChange={(e) => handleImage(i, e.target.value)}
              placeholder="/products/my-image.jpg"
              className={`${inputCls} flex-1`}
            />
            {form.images.length > 1 && (
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="px-2 text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={addImage}
            className="text-xs text-gold-soft hover:text-gold"
          >
            + Add image URL
          </button>

          <label className="cursor-pointer text-xs text-gold-soft hover:text-gold">
            {uploading ? "Uploading…" : "↑ Upload image to Blob"}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </section>

      {/* Beads (combination composition) */}
      <section className="space-y-4 rounded-sm border border-line bg-paper p-5">
        <h2 className="text-xs uppercase tracking-[0.18em] text-ink-faint">
          Beads (composition)
        </h2>
        <p className="text-xs text-ink-faint">
          For <strong>combinations</strong> made of multiple beads. Add one row
          per bead — mukhi, origin, and an optional one-line benefit. Origin
          above auto-sets to “Mixed” when beads span more than one origin. Leave
          empty for single-bead products.
        </p>

        {(form.beads ?? []).map((bead, i) => (
          <div key={i} className="flex flex-wrap items-start gap-2">
            <input
              type="number"
              value={bead.mukhi || ""}
              onChange={(e) =>
                handleBead(i, { mukhi: Number(e.target.value) })
              }
              min={0}
              max={21}
              placeholder="Mukhi"
              className={`${inputCls} w-24`}
            />
            <select
              value={bead.origin}
              onChange={(e) =>
                handleBead(i, { origin: e.target.value as BeadOrigin })
              }
              className={`${inputCls} w-36`}
            >
              {BEAD_ORIGINS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={bead.note ?? ""}
              onChange={(e) => handleBead(i, { note: e.target.value })}
              placeholder="One-line benefit (optional)"
              className={`${inputCls} min-w-[10rem] flex-1`}
            />
            <span className="py-2.5">
              <GenBtn field="beadNote" beadIndex={i} label="✨" />
            </span>
            <button
              type="button"
              onClick={() => removeBead(i)}
              className="px-2 py-2.5 text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addBead}
          className="text-xs text-gold-soft hover:text-gold"
        >
          + Add bead
        </button>
      </section>

      {/* Copy */}
      <section className="space-y-4 rounded-sm border border-line bg-paper p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xs uppercase tracking-[0.18em] text-ink-faint">Copy</h2>
          <GenBtn field="all" label="✨ Generate copy" />
        </div>
        <p className="text-xs text-ink-faint">
          Fills tagline, description, benefits{form.beads?.length ? " and bead notes" : ""} from the
          details above. Review and edit before saving. Uses the brand voice and never makes medical claims.
        </p>
        {genError && <p className="text-sm text-red-400">{genError}</p>}

        <Field label="Tagline" hint="Short one-liner shown on cards and hero.">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => set("tagline", e.target.value)}
              className={`${inputCls} flex-1`}
            />
            <GenBtn field="tagline" label="✨" />
          </div>
        </Field>

        <Field label="Description" hint="1–2 paragraphs for the product detail page.">
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className={`${inputCls} resize-y`}
          />
          <div className="mt-1">
            <GenBtn field="description" label="✨ Generate description" />
          </div>
        </Field>

        <Field label="Benefits" hint='One per line. No medical claims — frame as "traditionally associated with…"'>
          {form.benefits.map((b, i) => (
            <div key={i} className="mb-2 flex gap-2">
              <input
                type="text"
                value={b}
                onChange={(e) => handleBenefit(i, e.target.value)}
                className={`${inputCls} flex-1`}
              />
              {form.benefits.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBenefit(i)}
                  className="px-2 text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <div className="mt-1 flex items-center gap-4">
            <button
              type="button"
              onClick={addBenefit}
              className="text-xs text-gold-soft hover:text-gold"
            >
              + Add benefit
            </button>
            <GenBtn field="benefits" label="✨ Generate benefits" />
          </div>
        </Field>
      </section>

      {/* Flags */}
      <section className="space-y-3 rounded-sm border border-line bg-paper p-5">
        <h2 className="text-xs uppercase tracking-[0.18em] text-ink-faint">Badges</h2>

        <label className="flex items-center gap-3 text-sm text-ink-dim">
          <input
            type="checkbox"
            checked={!!form.bestseller}
            onChange={(e) => set("bestseller", e.target.checked)}
            className="h-4 w-4 accent-gold"
          />
          Bestseller
        </label>

        <label className="flex items-center gap-3 text-sm text-ink-dim">
          <input
            type="checkbox"
            checked={!!form.newArrival}
            onChange={(e) => set("newArrival", e.target.checked)}
            className="h-4 w-4 accent-gold"
          />
          New arrival
        </label>
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-4">
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? "Saving…" : mode === "new" ? "Create product" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="btn btn-outline"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
