import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "outline";

interface BaseProps {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
}

export type ButtonProps =
  | (BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" })
  | (BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { as: "a" });

export function Button({
  variant = "primary",
  as: Tag = "button",
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const cls = `btn btn-${variant}${className ? " " + className : ""}`;
  if (Tag === "a") {
    return (
      <a className={cls} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }
  return (
    <button className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
