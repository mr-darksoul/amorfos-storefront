import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for purchasing from Amorfos.",
  alternates: { canonical: "/terms" },
};

const lastUpdated = "25 June 2025";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 md:py-24">
      <p className="eyebrow mb-3">Legal</p>
      <h1 className="display text-4xl sm:text-5xl">Terms & Conditions</h1>
      <p className="mt-4 text-sm text-bone-faint">Last updated: {lastUpdated}</p>

      <div className="mt-12 space-y-12 text-bone-dim">

        <section>
          <h2 className="font-serif text-2xl text-bone">1. About us</h2>
          <div className="mt-4 space-y-3 leading-relaxed">
            <p>
              Amorfos is operated by {site.founder}, {site.address}, India
              ({site.email}). By placing an order on amorfos.in you agree to these Terms &amp;
              Conditions. Please read them carefully before purchasing.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-bone">2. Products</h2>
          <div className="mt-4 space-y-3 leading-relaxed">
            <p>
              All Amorfos Rudraksha products are authentic and Lab Certified. Rudraksha is
              a traditional spiritual item worn on the recommendation of astrologers and pandits.
            </p>
            <p>
              We make no medical, therapeutic or miraculous claims about any product. Product
              descriptions reference traditional associations only. Results, if any, may vary.
            </p>
            <p>
              Product images are representative. Natural variation in bead size, texture and
              colour is inherent to genuine Rudraksha; your item may differ slightly from
              the photograph.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-bone">3. Pricing and orders</h2>
          <div className="mt-4 space-y-3 leading-relaxed">
            <p>
              All prices are in Indian Rupees (₹) and are inclusive of applicable taxes.
              Prices are subject to change without notice, but the price displayed at the
              time of checkout is the price you will be charged.
            </p>
            <p>
              An order is accepted and a contract formed when payment is successfully
              processed and you receive an order confirmation. We reserve the right to cancel
              an order if the product is out of stock or if we detect a pricing error; in
              such cases a full refund will be issued.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-bone">4. Payment</h2>
          <div className="mt-4 space-y-3 leading-relaxed">
            <p>
              Payments are processed by Razorpay, a PCI-DSS Level 1 certified payment gateway.
              We accept UPI, credit/debit cards, net banking and other methods available
              through Razorpay. We do not store your payment card details.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-bone">5. Shipping</h2>
          <div className="mt-4 space-y-3 leading-relaxed">
            <p>
              Orders are dispatched within 1–2 business days from Delhi. Delivery typically
              takes 3–6 business days, depending on your location. You will receive a tracking
              number once your order ships.
            </p>
            <p>
              Shipping is free on orders above ₹{site.freeShippingThreshold}. A flat charge of ₹79
              applies to orders below this threshold.
            </p>
            <p>
              Risk of loss or damage passes to you upon handover to the courier. If your
              package arrives damaged, contact us on WhatsApp within 48 hours of delivery.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-bone">6. Returns and refunds</h2>
          <div className="mt-4 space-y-3 leading-relaxed">
            <p>
              We accept returns within 7 days of delivery on unused products in their
              original, sealed packaging. Because each Rudraksha bead is a consecrated,
              personal item, products that have been worn, used in puja, or whose seal has
              been broken cannot be returned.
            </p>
            <p>
              To initiate a return, message us on WhatsApp ({site.whatsappDisplay}) with your
              order details. Once we receive and inspect the returned item, a refund will
              be issued to your original payment method within 5–7 business days.
            </p>
            <p>Return shipping is at the buyer&apos;s expense.</p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-bone">7. Intellectual property</h2>
          <div className="mt-4 space-y-3 leading-relaxed">
            <p>
              All content on this website — including text, images, the Amorfos name and logo —
              is the property of Amorfos and may not be reproduced without prior written
              permission.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-bone">8. Limitation of liability</h2>
          <div className="mt-4 space-y-3 leading-relaxed">
            <p>
              To the fullest extent permitted by law, Amorfos&apos; liability is limited to the
              purchase price of the product in question. We are not liable for indirect,
              incidental or consequential damages arising from the use or inability to use
              our products.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-bone">9. Governing law and disputes</h2>
          <div className="mt-4 space-y-3 leading-relaxed">
            <p>
              These Terms are governed by the laws of India. Any disputes arising from a
              purchase shall first be attempted to be resolved amicably by contacting us at{" "}
              <a href={`mailto:${site.email}`} className="text-gold-soft hover:underline">
                {site.email}
              </a>. Unresolved disputes shall be subject to the exclusive jurisdiction of
              courts in Delhi.
            </p>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-bone">10. Changes to these terms</h2>
          <div className="mt-4 space-y-3 leading-relaxed">
            <p>
              We may update these Terms at any time. The &quot;Last updated&quot; date at the top of
              this page reflects the most recent revision. Continued use of the site after
              changes constitutes acceptance of the updated Terms.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
