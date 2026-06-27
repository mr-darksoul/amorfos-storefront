import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Amorfos collects, uses and protects your personal information.",
  alternates: { canonical: "/privacy-policy" },
};

const lastUpdated = "25 June 2025";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 md:py-24">
      <p className="eyebrow mb-3">Legal</p>
      <h1 className="display text-4xl sm:text-5xl">Privacy Policy</h1>
      <p className="mt-4 text-sm text-ink-faint">Last updated: {lastUpdated}</p>

      <div className="mt-12 space-y-12 text-ink-dim">

        <section>
          <h2 className="font-serif text-2xl text-ink">1. Who we are</h2>
          <div className="mt-4 space-y-3 leading-relaxed">
            <p>
              Amorfos is a Delhi-based seller of authentic, Lab Certified Rudraksha products
              operated by {site.founder}, {site.address}, India.
            </p>
            <p>
              This Privacy Policy explains how we collect, use, share and protect your personal
              information when you visit <strong>amorfos.in</strong> or purchase from us.
            </p>
            <p>
              For questions about this policy, contact us at{" "}
              <a href={`mailto:${site.email}`} className="text-gold-soft hover:underline">
                {site.email}
              </a>{" "}
              or WhatsApp {site.whatsappDisplay}.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-ink">2. Information we collect</h2>
          <div className="mt-4 space-y-3 leading-relaxed">
            <p>
              <strong className="text-ink">When you place an order:</strong> your name, delivery
              address, phone number, and email address. Payment card details are processed directly
              by Razorpay and are never stored on our servers.
            </p>
            <p>
              <strong className="text-ink">When you browse:</strong> standard server logs
              (IP address, browser type, pages visited). We use your browser&apos;s
              localStorage to persist your shopping cart across sessions; no cookies are set by
              our site itself.
            </p>
            <p>
              <strong className="text-ink">When you contact us:</strong> messages sent via
              WhatsApp or email are retained to handle your enquiry.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-ink">3. How we use your information</h2>
          <div className="mt-4 space-y-3 leading-relaxed">
            <p>We use your information only to:</p>
            <ul className="ml-5 list-disc space-y-2">
              <li>Process and fulfil your order, including dispatch and delivery.</li>
              <li>Send you order confirmation and shipping updates via WhatsApp or email.</li>
              <li>Respond to your enquiries and handle returns.</li>
              <li>Comply with our legal obligations (e.g., tax records).</li>
            </ul>
            <p>We do not use your information for targeted advertising or sell it to any third party.</p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-ink">4. Sharing your information</h2>
          <div className="mt-4 space-y-3 leading-relaxed">
            <p>We share your data only with:</p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                <strong className="text-ink">Razorpay</strong> — to process your payment. Razorpay
                is a PCI-DSS Level 1 certified payment gateway. Their privacy policy is available at
                razorpay.com/privacy.
              </li>
              <li>
                <strong className="text-ink">Courier partners</strong> (e.g., India Post,
                Delhivery, Shiprocket) — to deliver your order. Only your name, address, and
                phone number are shared.
              </li>
            </ul>
            <p>We do not sell, rent or trade your personal information to any other third party.</p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-ink">5. Data retention</h2>
          <div className="mt-4 space-y-3 leading-relaxed">
            <p>
              Order records (name, address, items, payment reference) are retained for seven years
              as required by Indian tax law. WhatsApp and email correspondence is retained for as
              long as necessary to resolve any dispute.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-ink">6. Your rights</h2>
          <div className="mt-4 space-y-3 leading-relaxed">
            <p>You may contact us at any time to:</p>
            <ul className="ml-5 list-disc space-y-2">
              <li>Request access to the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data (subject to our legal obligations).</li>
            </ul>
            <p>
              To exercise these rights, email{" "}
              <a href={`mailto:${site.email}`} className="text-gold-soft hover:underline">
                {site.email}
              </a>.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-ink">7. Security</h2>
          <div className="mt-4 space-y-3 leading-relaxed">
            <p>
              Our website is served over HTTPS. Payments are handled entirely by Razorpay; we
              never see or store your card details. We take reasonable technical measures to
              protect the data we do hold.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-ink">8. Changes to this policy</h2>
          <div className="mt-4 space-y-3 leading-relaxed">
            <p>
              We may update this policy from time to time. The &quot;Last updated&quot; date at the
              top of this page will reflect any changes. Continued use of the site after an update
              constitutes acceptance of the revised policy.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-ink">9. Governing law</h2>
          <div className="mt-4 space-y-3 leading-relaxed">
            <p>
              This policy is governed by the laws of India, including the Information Technology
              Act, 2000 and rules made thereunder. Any disputes shall be subject to the exclusive
              jurisdiction of courts in Delhi.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
