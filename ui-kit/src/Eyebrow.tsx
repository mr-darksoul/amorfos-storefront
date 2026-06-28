import type { ReactNode, ElementType, HTMLAttributes } from "react";

export interface EyebrowProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  as?: ElementType;
}

export function Eyebrow({ children, as: Tag = "p", className = "", ...rest }: EyebrowProps) {
  return (
    <Tag className={`eyebrow${className ? " " + className : ""}`} {...rest}>
      {children}
    </Tag>
  );
}
