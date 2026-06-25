import Link from "next/link";
import Logo from "./Logo";
import { site, waLink } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="relative mt-24 border-t border-line bg-ink-raised">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo width={150} />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-bone-dim">
            Authentic, Lab Certified Rudraksha — pendants, malas and combination
            pieces in hand-finished silver. A Delhi house.
          </p>
          <p className="mt-4 text-xs tracking-wide text-bone-faint">
            Founded by {site.founder} · {site.address}
          </p>
        </div>

        <FooterCol title="Shop">
          <FooterLink href="/shop">All products</FooterLink>
          <FooterLink href="/shop?category=pendant">Pendants</FooterLink>
          <FooterLink href="/shop?category=mala">Malas</FooterLink>
          <FooterLink href="/shop?category=combination">Combination</FooterLink>
          <FooterLink href="/shop?category=loose">Loose beads</FooterLink>
        </FooterCol>

        <FooterCol title="House">
          <FooterLink href="/about">Our story</FooterLink>
          <FooterLink href="/policies#shipping">Shipping</FooterLink>
          <FooterLink href="/policies#returns">7-day returns</FooterLink>
          <FooterLink href="/policies#authenticity">Lab certification</FooterLink>
          <FooterLink href="/privacy-policy">Privacy policy</FooterLink>
          <FooterLink href="/terms">Terms &amp; conditions</FooterLink>
        </FooterCol>

        <FooterCol title="Reach us">
          <li>
            <a
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-bone-dim transition-colors hover:text-gold-soft"
            >
              WhatsApp · {site.whatsappDisplay}
            </a>
          </li>
          <li>
            <a
              href={`mailto:${site.email}`}
              className="text-sm text-bone-dim transition-colors hover:text-gold-soft"
            >
              {site.email}
            </a>
          </li>
        </FooterCol>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-bone-faint sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p className="max-w-xl leading-relaxed">
            Rudraksha is worn on the basis of recommendations from astrologers and
            pandits. We make no medical claims.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="eyebrow mb-5">{title}</h4>
      <ul className="space-y-3">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-bone-dim transition-colors hover:text-gold-soft"
      >
        {children}
      </Link>
    </li>
  );
}
