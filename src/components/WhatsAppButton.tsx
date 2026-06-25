"use client";

import { WhatsAppIcon } from "./icons";
import { waLink } from "@/lib/site";

export default function WhatsAppButton() {
  return (
    <a
      href={waLink("Hello Amorfos — I have a question about your Rudraksha.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-0 overflow-hidden rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)] transition-all hover:gap-2.5 hover:pr-5"
    >
      <span className="grid size-14 place-items-center">
        <WhatsAppIcon className="size-7" />
      </span>
      <span className="max-w-0 whitespace-nowrap text-sm font-medium tracking-wide opacity-0 transition-all duration-300 group-hover:max-w-[140px] group-hover:opacity-100">
        Chat with us
      </span>
    </a>
  );
}
