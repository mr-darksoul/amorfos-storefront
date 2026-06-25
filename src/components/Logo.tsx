import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

export default function Logo({
  className = "",
  width = 150,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <Link
      href="/"
      aria-label={`${site.name} — home`}
      className={`inline-flex items-center ${className}`}
    >
      <Image
        src="/brand/logo-dark.png"
        alt={site.name}
        width={width}
        height={Math.round(width * 0.247)}
        priority
        className="h-auto w-auto"
        style={{ width, height: "auto" }}
      />
    </Link>
  );
}
