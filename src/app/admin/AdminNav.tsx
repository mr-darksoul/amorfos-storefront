import Link from "next/link";
import AdminLogoutButton from "./products/AdminLogoutButton";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/journal", label: "Journal" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/instagram", label: "Instagram" },
];

/** Shared admin header links. `current` is the href of the page being shown. */
export default function AdminNav({ current }: { current?: string }) {
  return (
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {LINKS.map((l) =>
        l.href === current ? (
          <span key={l.href} className="text-sm font-medium text-ink">
            {l.label}
          </span>
        ) : (
          <Link key={l.href} href={l.href} className="text-sm text-gold-soft hover:underline">
            {l.label}
          </Link>
        ),
      )}
      <AdminLogoutButton />
    </nav>
  );
}
