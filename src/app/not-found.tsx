import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 py-20 text-center">
      <p className="eyebrow mb-4">404</p>
      <h1 className="display text-4xl sm:text-5xl">This page slipped away.</h1>
      <p className="mt-4 text-ink-dim">
        The thread you followed doesn&apos;t lead anywhere. Let&apos;s find your bead.
      </p>
      <Link href="/shop" className="btn btn-primary mt-8">
        Back to the collection
      </Link>
    </div>
  );
}
