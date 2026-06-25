"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { BagIcon, CloseIcon, MenuIcon } from "./icons";
import { useCart } from "@/context/CartContext";

const nav = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=pendant", label: "Pendants" },
  { href: "/shop?category=mala", label: "Malas" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const { count, open } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-ink-raised text-center text-[0.68rem] tracking-[0.25em] uppercase text-gold-soft/90 py-2 px-4 border-b border-line">
        Lab Certified · Free shipping above ₹999 · 7-day returns
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-ink/90 backdrop-blur-md border-b border-line py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden text-bone p-1 -ml-1"
            aria-label="Toggle menu"
          >
            {menuOpen ? <CloseIcon className="size-6" /> : <MenuIcon className="size-6" />}
          </button>

          {/* Left nav (desktop) */}
          <nav className="hidden md:flex items-center gap-8 flex-1">
            {nav.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                className="text-[0.78rem] tracking-[0.18em] uppercase text-bone-dim hover:text-gold-soft transition-colors"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Center logo */}
          <Logo
            width={scrolled ? 128 : 150}
            className="absolute left-1/2 -translate-x-1/2 transition-all"
          />

          {/* Cart */}
          <div className="flex flex-1 items-center justify-end">
            <button
              onClick={open}
              className="relative text-bone hover:text-gold-soft transition-colors p-1"
              aria-label={`Open cart, ${count} items`}
            >
              <BagIcon className="size-6" />
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[0.6rem] font-medium text-ink">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer menu */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
        <nav
          className={`absolute left-0 top-0 h-full w-72 bg-ink-raised border-r border-line p-8 pt-24 transition-transform duration-400 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <ul className="space-y-6">
            {nav.map((n) => (
              <li key={n.label}>
                <Link
                  href={n.href}
                  className="font-serif text-2xl text-bone hover:text-gold-soft transition-colors"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
