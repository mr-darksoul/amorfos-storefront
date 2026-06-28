// src/Button.tsx
import { jsx } from "react/jsx-runtime";
function Button({
  variant = "primary",
  as: Tag = "button",
  children,
  className = "",
  ...rest
}) {
  const cls = `btn btn-${variant}${className ? " " + className : ""}`;
  if (Tag === "a") {
    return /* @__PURE__ */ jsx("a", { className: cls, ...rest, children });
  }
  return /* @__PURE__ */ jsx("button", { className: cls, ...rest, children });
}

// src/Badge.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
var styles = {
  default: {
    background: "var(--color-paper-raised)",
    color: "var(--color-ink-dim)",
    border: "1px solid var(--color-line)"
  },
  gold: {
    background: "transparent",
    color: "var(--color-gold)",
    border: "1px solid var(--color-gold)"
  },
  dark: {
    background: "var(--color-dark)",
    color: "var(--color-cream)",
    border: "none"
  },
  rudra: {
    background: "var(--color-rudra)",
    color: "var(--color-cream)",
    border: "none"
  }
};
function Badge({ children, variant = "default", className = "" }) {
  return /* @__PURE__ */ jsx2(
    "span",
    {
      className,
      style: {
        display: "inline-flex",
        alignItems: "center",
        padding: "0.2rem 0.6rem",
        borderRadius: "999px",
        fontSize: "0.62rem",
        fontFamily: "var(--font-sans)",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        fontWeight: 500,
        lineHeight: 1.6,
        ...styles[variant]
      },
      children
    }
  );
}

// src/Eyebrow.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
function Eyebrow({ children, as: Tag = "p", className = "", ...rest }) {
  return /* @__PURE__ */ jsx3(Tag, { className: `eyebrow${className ? " " + className : ""}`, ...rest, children });
}

// src/StarRating.tsx
import { jsx as jsx4, jsxs } from "react/jsx-runtime";
function StarRating({ rating, size = "sm", showValue = false, count, className = "" }) {
  const px = size === "lg" ? 20 : size === "md" ? 16 : 14;
  const gap = size === "lg" ? 4 : 2;
  return /* @__PURE__ */ jsxs(
    "span",
    {
      className,
      style: { display: "inline-flex", alignItems: "center", gap: "6px" },
      children: [
        /* @__PURE__ */ jsx4("span", { style: { display: "flex", alignItems: "center", gap: `${gap}px` }, children: [1, 2, 3, 4, 5].map((n) => /* @__PURE__ */ jsx4("svg", { viewBox: "0 0 20 20", width: px, height: px, "aria-hidden": true, children: /* @__PURE__ */ jsx4(
          "path",
          {
            d: "M10 1l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.3l-5.2 2.7 1-5.8L1.6 7.1l5.8-.8z",
            fill: rating >= n ? "var(--color-gold)" : rating >= n - 0.5 ? "var(--color-gold-soft)" : "var(--color-paper-soft)",
            stroke: "var(--color-gold)",
            strokeWidth: "0.6"
          }
        ) }, n)) }),
        showValue && /* @__PURE__ */ jsxs(
          "span",
          {
            style: {
              fontSize: "0.75rem",
              color: "var(--color-ink-faint)",
              fontFamily: "var(--font-sans)"
            },
            children: [
              rating.toFixed(1),
              count !== void 0 ? ` (${count})` : ""
            ]
          }
        )
      ]
    }
  );
}

// src/Reveal.tsx
import { useEffect, useRef, useState } from "react";
import { jsx as jsx5 } from "react/jsx-runtime";
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);
  return /* @__PURE__ */ jsx5(
    "div",
    {
      ref,
      className: `reveal${visible ? " is-visible" : ""}${className ? " " + className : ""}`,
      children
    }
  );
}

// src/ReviewForm.tsx
import { useState as useState2 } from "react";
import { jsx as jsx6, jsxs as jsxs2 } from "react/jsx-runtime";
function ReviewForm({ productName, mukhi, apiUrl = "/api/reviews", onSubmitted }) {
  const [rating, setRating] = useState2(0);
  const [hover, setHover] = useState2(0);
  const [name, setName] = useState2("");
  const [title, setTitle] = useState2("");
  const [body, setBody] = useState2("");
  const [state, setState] = useState2("idle");
  async function submit(e) {
    e.preventDefault();
    if (!rating || !name.trim() || !body.trim()) return;
    setState("submitting");
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mukhi, reviewer: name.trim(), rating, title: title.trim(), body: body.trim() })
      });
      if (res.ok) {
        setState("done");
        onSubmitted?.();
      } else setState("error");
    } catch {
      setState("error");
    }
  }
  if (state === "done") {
    return /* @__PURE__ */ jsxs2(
      "div",
      {
        style: {
          borderRadius: "2px",
          border: "1px solid var(--color-line)",
          background: "var(--color-paper-raised)",
          padding: "2rem 1.5rem",
          textAlign: "center"
        },
        children: [
          /* @__PURE__ */ jsx6("p", { style: { fontFamily: "var(--font-serif)", fontSize: "1.25rem", color: "var(--color-ink)", margin: 0 }, children: "Thank you for your review" }),
          /* @__PURE__ */ jsx6("p", { style: { marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--color-ink-faint)" }, children: "It will appear once verified." })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      style: {
        borderTop: "1px solid var(--color-line)",
        paddingTop: "2.5rem",
        marginTop: "2.5rem"
      },
      children: [
        /* @__PURE__ */ jsx6("p", { className: "eyebrow", style: { marginBottom: "1rem" }, children: "Write a review" }),
        /* @__PURE__ */ jsxs2("form", { onSubmit: submit, style: { display: "flex", flexDirection: "column", gap: "1.25rem" }, children: [
          /* @__PURE__ */ jsxs2("div", { children: [
            /* @__PURE__ */ jsx6("label", { className: "amf-label", children: "Your rating" }),
            /* @__PURE__ */ jsx6("div", { style: { display: "flex", gap: "4px" }, children: [1, 2, 3, 4, 5].map((n) => /* @__PURE__ */ jsx6(
              "button",
              {
                type: "button",
                onClick: () => setRating(n),
                onMouseEnter: () => setHover(n),
                onMouseLeave: () => setHover(0),
                style: { padding: "2px", background: "none", border: "none", cursor: "pointer" },
                "aria-label": `${n} star`,
                children: /* @__PURE__ */ jsx6("svg", { viewBox: "0 0 20 20", width: 28, height: 28, children: /* @__PURE__ */ jsx6(
                  "path",
                  {
                    d: "M10 1l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.3l-5.2 2.7 1-5.8L1.6 7.1l5.8-.8z",
                    fill: (hover || rating) >= n ? "var(--color-gold)" : "var(--color-paper-soft)",
                    stroke: "var(--color-gold)",
                    strokeWidth: "0.6"
                  }
                ) })
              },
              n
            )) })
          ] }),
          /* @__PURE__ */ jsxs2("div", { children: [
            /* @__PURE__ */ jsxs2("label", { className: "amf-label", children: [
              "Your name ",
              /* @__PURE__ */ jsx6("span", { style: { color: "var(--color-rudra)" }, children: "*" })
            ] }),
            /* @__PURE__ */ jsx6(
              "input",
              {
                value: name,
                onChange: (e) => setName(e.target.value),
                required: true,
                placeholder: "e.g. Rahul S.",
                className: "amf-input"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs2("div", { children: [
            /* @__PURE__ */ jsx6("label", { className: "amf-label", children: "Review title" }),
            /* @__PURE__ */ jsx6(
              "input",
              {
                value: title,
                onChange: (e) => setTitle(e.target.value),
                placeholder: "e.g. Beautiful bead, very authentic",
                className: "amf-input"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs2("div", { children: [
            /* @__PURE__ */ jsxs2("label", { className: "amf-label", children: [
              "Your review ",
              /* @__PURE__ */ jsx6("span", { style: { color: "var(--color-rudra)" }, children: "*" })
            ] }),
            /* @__PURE__ */ jsx6(
              "textarea",
              {
                value: body,
                onChange: (e) => setBody(e.target.value),
                required: true,
                rows: 4,
                placeholder: `Share your experience with ${productName}\u2026`,
                className: "amf-textarea"
              }
            )
          ] }),
          state === "error" && /* @__PURE__ */ jsx6("p", { style: { fontSize: "0.875rem", color: "var(--color-rudra)", margin: 0 }, children: "Something went wrong. Please try again." }),
          /* @__PURE__ */ jsx6(
            "button",
            {
              type: "submit",
              disabled: !rating || !name.trim() || !body.trim() || state === "submitting",
              className: "btn btn-primary",
              style: { opacity: !rating || !name.trim() || !body.trim() ? 0.4 : 1 },
              children: state === "submitting" ? "Submitting\u2026" : "Submit review"
            }
          )
        ] })
      ]
    }
  );
}

// src/ReviewSection.tsx
import { useState as useState3 } from "react";
import { Fragment, jsx as jsx7, jsxs as jsxs3 } from "react/jsx-runtime";
function DistBar({ label, count, total }) {
  const pct = total > 0 ? count / total * 100 : 0;
  return /* @__PURE__ */ jsxs3("div", { style: { display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", color: "var(--color-ink-dim)" }, children: [
    /* @__PURE__ */ jsxs3("span", { style: { width: "48px", textAlign: "right", flexShrink: 0 }, children: [
      label,
      " star"
    ] }),
    /* @__PURE__ */ jsx7("div", { style: { flex: 1, height: "6px", borderRadius: "999px", background: "var(--color-paper-soft)", overflow: "hidden" }, children: /* @__PURE__ */ jsx7("div", { style: { height: "100%", borderRadius: "999px", background: "var(--color-gold)", width: `${pct}%` } }) }),
    /* @__PURE__ */ jsx7("span", { style: { width: "24px", textAlign: "right", color: "var(--color-ink-faint)" }, children: count })
  ] });
}
function ReviewSection({ reviews, summary, pageSize = 6 }) {
  const [shown, setShown] = useState3(pageSize);
  if (summary.total === 0) return null;
  const visible = reviews.slice(0, shown);
  return /* @__PURE__ */ jsxs3("section", { id: "reviews", style: { marginTop: "4rem", borderTop: "1px solid var(--color-line)", paddingTop: "3rem" }, children: [
    /* @__PURE__ */ jsx7("p", { className: "eyebrow", style: { marginBottom: "1rem" }, children: "What customers say" }),
    /* @__PURE__ */ jsxs3(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          marginBottom: "2.5rem"
        },
        children: [
          /* @__PURE__ */ jsxs3("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }, children: [
            /* @__PURE__ */ jsx7("span", { style: { fontFamily: "var(--font-serif)", fontSize: "3rem", lineHeight: 1, color: "var(--color-ink)" }, children: summary.average.toFixed(1) }),
            /* @__PURE__ */ jsx7(StarRating, { rating: summary.average, size: "lg" }),
            /* @__PURE__ */ jsxs3("span", { style: { fontSize: "0.75rem", color: "var(--color-ink-faint)", marginTop: "2px" }, children: [
              summary.total,
              " review",
              summary.total !== 1 ? "s" : ""
            ] })
          ] }),
          /* @__PURE__ */ jsx7("div", { style: { display: "flex", flexDirection: "column", gap: "8px", maxWidth: "320px" }, children: [5, 4, 3, 2, 1].map((n) => /* @__PURE__ */ jsx7(DistBar, { label: String(n), count: summary.distribution[n], total: summary.total }, n)) })
        ]
      }
    ),
    /* @__PURE__ */ jsx7("div", { style: { display: "flex", flexDirection: "column", gap: "2rem" }, children: visible.map((r) => /* @__PURE__ */ jsxs3(
      "div",
      {
        style: { borderBottom: "1px solid var(--color-line)", paddingBottom: "2rem" },
        children: [
          /* @__PURE__ */ jsxs3("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.5rem" }, children: [
            /* @__PURE__ */ jsxs3("div", { children: [
              /* @__PURE__ */ jsx7(StarRating, { rating: r.rating, size: "sm" }),
              r.title && /* @__PURE__ */ jsx7("p", { style: { marginTop: "6px", fontWeight: 500, color: "var(--color-ink)", fontSize: "0.875rem", lineHeight: 1.3, margin: "6px 0 0" }, children: r.title })
            ] }),
            r.verified && /* @__PURE__ */ jsx7(
              "span",
              {
                style: {
                  flexShrink: 0,
                  borderRadius: "999px",
                  border: "1px solid var(--color-line)",
                  padding: "2px 10px",
                  fontSize: "0.62rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--color-gold)",
                  fontFamily: "var(--font-sans)"
                },
                children: "Verified"
              }
            )
          ] }),
          /* @__PURE__ */ jsx7("p", { style: { fontSize: "0.875rem", lineHeight: 1.65, color: "var(--color-ink-dim)", margin: 0 }, children: r.body }),
          /* @__PURE__ */ jsxs3("p", { style: { marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--color-ink-faint)", margin: "8px 0 0" }, children: [
            r.reviewer,
            r.review_date && /* @__PURE__ */ jsxs3(Fragment, { children: [
              " \xB7 ",
              new Date(r.review_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
            ] })
          ] })
        ]
      },
      r.id
    )) }),
    shown < reviews.length && /* @__PURE__ */ jsxs3(
      "button",
      {
        onClick: () => setShown((n) => n + pageSize),
        className: "btn btn-outline",
        style: { marginTop: "2rem", fontSize: "0.875rem" },
        children: [
          "Show more (",
          reviews.length - shown,
          " remaining)"
        ]
      }
    )
  ] });
}

// src/ProductCard.tsx
import { jsx as jsx8, jsxs as jsxs4 } from "react/jsx-runtime";
function discountPct(price, mrp) {
  if (!mrp || mrp <= price) return 0;
  return Math.round((mrp - price) / mrp * 100);
}
function ProductCard({ product, rating, onAddToCart, currency = "\u20B9" }) {
  const off = discountPct(product.price, product.mrp);
  const soldOut = product.stock === 0;
  const href = product.href ?? `/shop/${product.id}`;
  return /* @__PURE__ */ jsxs4(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-sans)"
      },
      children: [
        /* @__PURE__ */ jsxs4("a", { href, style: { display: "block", position: "relative", textDecoration: "none" }, children: [
          /* @__PURE__ */ jsx8(
            "div",
            {
              style: {
                background: "#fdfbf8",
                borderRadius: "2px",
                overflow: "hidden",
                aspectRatio: "4/5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              },
              children: product.images[0] ? /* @__PURE__ */ jsx8(
                "img",
                {
                  src: product.images[0],
                  alt: product.name,
                  style: { width: "100%", height: "100%", objectFit: "contain" }
                }
              ) : /* @__PURE__ */ jsx8("span", { style: { fontSize: "3rem", color: "var(--color-paper-soft)" }, children: "\u233E" })
            }
          ),
          off > 0 && /* @__PURE__ */ jsx8("div", { style: { position: "absolute", top: "10px", left: "10px" }, children: /* @__PURE__ */ jsxs4(Badge, { variant: "dark", children: [
            off,
            "% off"
          ] }) }),
          soldOut && /* @__PURE__ */ jsx8(
            "div",
            {
              style: {
                position: "absolute",
                inset: 0,
                background: "rgba(246,241,231,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              },
              children: /* @__PURE__ */ jsx8("span", { style: { fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-ink-dim)" }, children: "Sold out" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs4("div", { style: { marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "4px", flex: 1 }, children: [
          rating && rating.count > 0 && /* @__PURE__ */ jsx8(StarRating, { rating: rating.average, size: "sm", showValue: true, count: rating.count }),
          /* @__PURE__ */ jsx8(
            "a",
            {
              href,
              style: { textDecoration: "none", color: "var(--color-ink)", fontSize: "0.9rem", lineHeight: 1.4, fontWeight: 400 },
              children: product.name
            }
          ),
          /* @__PURE__ */ jsxs4("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
            /* @__PURE__ */ jsxs4("span", { style: { fontWeight: 500, fontSize: "0.95rem", color: "var(--color-ink)" }, children: [
              currency,
              product.price.toLocaleString("en-IN")
            ] }),
            product.mrp && product.mrp > product.price && /* @__PURE__ */ jsxs4("span", { style: { fontSize: "0.8rem", color: "var(--color-ink-faint)", textDecoration: "line-through" }, children: [
              currency,
              product.mrp.toLocaleString("en-IN")
            ] })
          ] })
        ] }),
        !soldOut && onAddToCart && /* @__PURE__ */ jsx8(
          "button",
          {
            onClick: () => onAddToCart(product),
            className: "btn btn-outline",
            style: { marginTop: "0.75rem", fontSize: "0.72rem", padding: "0.6rem 1rem" },
            children: "Add to cart"
          }
        )
      ]
    }
  );
}

// src/ArticleCard.tsx
import { jsx as jsx9, jsxs as jsxs5 } from "react/jsx-runtime";
var FALLBACK_HERO = "/products/pendant-7-mukhi-1.jpg";
var DEFAULT_CLUSTER_LABELS = {
  rudraksha: "Rudraksha Guide",
  spiritual: "Spiritual Living",
  astrology: "Astrology",
  wellness: "Wellness"
};
function ArticleCard({ article, clusterLabels = DEFAULT_CLUSTER_LABELS }) {
  const href = article.href ?? `/journal/${article.slug}`;
  const clusterLabel = article.cluster ? clusterLabels[article.cluster] ?? article.cluster : null;
  return /* @__PURE__ */ jsxs5(
    "a",
    {
      href,
      style: {
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        color: "inherit",
        fontFamily: "var(--font-sans)"
      },
      children: [
        /* @__PURE__ */ jsx9(
          "div",
          {
            style: {
              position: "relative",
              aspectRatio: "4/3",
              overflow: "hidden",
              borderRadius: "2px",
              background: "#FDFBF7"
            },
            children: /* @__PURE__ */ jsx9(
              "img",
              {
                src: article.heroImage || FALLBACK_HERO,
                alt: article.h1,
                style: { width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.7s" },
                onMouseEnter: (e) => e.currentTarget.style.transform = "scale(1.05)",
                onMouseLeave: (e) => e.currentTarget.style.transform = "scale(1)"
              }
            )
          }
        ),
        /* @__PURE__ */ jsxs5("div", { style: { marginTop: "0.875rem", display: "flex", flexDirection: "column", gap: "6px" }, children: [
          clusterLabel && /* @__PURE__ */ jsx9(
            "span",
            {
              style: {
                fontSize: "0.6rem",
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                color: "var(--color-gold)",
                fontFamily: "var(--font-sans)",
                fontWeight: 500
              },
              children: clusterLabel
            }
          ),
          /* @__PURE__ */ jsx9(
            "h3",
            {
              style: {
                margin: 0,
                fontFamily: "var(--font-serif)",
                fontSize: "1.2rem",
                fontWeight: 500,
                lineHeight: 1.25,
                color: "var(--color-ink)"
              },
              children: article.h1
            }
          ),
          article.excerpt && /* @__PURE__ */ jsx9(
            "p",
            {
              style: {
                margin: 0,
                fontSize: "0.83rem",
                lineHeight: 1.6,
                color: "var(--color-ink-dim)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              },
              children: article.excerpt
            }
          ),
          article.published_at && /* @__PURE__ */ jsx9("span", { style: { fontSize: "0.7rem", color: "var(--color-ink-faint)" }, children: new Date(article.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) })
        ] })
      ]
    }
  );
}

// src/Icons.tsx
import { jsx as jsx10, jsxs as jsxs6 } from "react/jsx-runtime";
var base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24"
};
var BagIcon = (p) => /* @__PURE__ */ jsxs6("svg", { ...base, ...p, children: [
  /* @__PURE__ */ jsx10("path", { d: "M6 8h12l-1 12H7L6 8Z" }),
  /* @__PURE__ */ jsx10("path", { d: "M9 8V6a3 3 0 0 1 6 0v2" })
] });
var CloseIcon = (p) => /* @__PURE__ */ jsx10("svg", { ...base, ...p, children: /* @__PURE__ */ jsx10("path", { d: "M6 6l12 12M18 6 6 18" }) });
var MenuIcon = (p) => /* @__PURE__ */ jsx10("svg", { ...base, ...p, children: /* @__PURE__ */ jsx10("path", { d: "M4 7h16M4 12h16M4 17h16" }) });
var PlusIcon = (p) => /* @__PURE__ */ jsx10("svg", { ...base, ...p, children: /* @__PURE__ */ jsx10("path", { d: "M12 5v14M5 12h14" }) });
var MinusIcon = (p) => /* @__PURE__ */ jsx10("svg", { ...base, ...p, children: /* @__PURE__ */ jsx10("path", { d: "M5 12h14" }) });
var CheckIcon = (p) => /* @__PURE__ */ jsx10("svg", { ...base, ...p, children: /* @__PURE__ */ jsx10("path", { d: "M4 12.5 9 17.5 20 6.5" }) });
var ArrowIcon = (p) => /* @__PURE__ */ jsx10("svg", { ...base, ...p, children: /* @__PURE__ */ jsx10("path", { d: "M5 12h14M13 6l6 6-6 6" }) });
var ShieldIcon = (p) => /* @__PURE__ */ jsxs6("svg", { ...base, ...p, children: [
  /* @__PURE__ */ jsx10("path", { d: "M12 3 5 6v6c0 4 3 6.5 7 9 4-2.5 7-5 7-9V6l-7-3Z" }),
  /* @__PURE__ */ jsx10("path", { d: "M9 12l2 2 4-4.5" })
] });
var TruckIcon = (p) => /* @__PURE__ */ jsxs6("svg", { ...base, ...p, children: [
  /* @__PURE__ */ jsx10("path", { d: "M3 7h11v9H3zM14 10h4l3 3v3h-7" }),
  /* @__PURE__ */ jsx10("circle", { cx: "7", cy: "18", r: "1.6" }),
  /* @__PURE__ */ jsx10("circle", { cx: "17", cy: "18", r: "1.6" })
] });
var ReturnIcon = (p) => /* @__PURE__ */ jsxs6("svg", { ...base, ...p, children: [
  /* @__PURE__ */ jsx10("path", { d: "M4 9a8 8 0 1 1-1 4" }),
  /* @__PURE__ */ jsx10("path", { d: "M4 4v5h5" })
] });
var LeafIcon = (p) => /* @__PURE__ */ jsxs6("svg", { ...base, ...p, children: [
  /* @__PURE__ */ jsx10("path", { d: "M5 19c0-8 6-14 14-14 0 8-6 14-14 14Z" }),
  /* @__PURE__ */ jsx10("path", { d: "M5 19C9 15 13 12 17 9" })
] });
var WhatsAppIcon = (p) => /* @__PURE__ */ jsx10("svg", { viewBox: "0 0 24 24", fill: "currentColor", ...p, children: /* @__PURE__ */ jsx10("path", { d: "M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.95 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35ZM12.04 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.38 9.38 0 0 1-1.44-5.01c0-5.18 4.22-9.4 9.41-9.4 2.51 0 4.87.98 6.64 2.76a9.34 9.34 0 0 1 2.75 6.65c0 5.18-4.22 9.4-9.4 9.4Zm8-17.4A11.36 11.36 0 0 0 12.04.75C5.8.75.73 5.82.73 12.05c0 2 .52 3.95 1.52 5.67L.63 23.5l5.92-1.55a11.3 11.3 0 0 0 5.48 1.4h.01c6.24 0 11.31-5.07 11.31-11.3 0-3.02-1.18-5.86-3.31-7.95Z" }) });

// src/WhatsAppButton.tsx
import { jsx as jsx11, jsxs as jsxs7 } from "react/jsx-runtime";
function WhatsAppButton({
  phone,
  message = "Hello \u2014 I have a question about your Rudraksha."
}) {
  const href = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  return /* @__PURE__ */ jsxs7(
    "a",
    {
      href,
      target: "_blank",
      rel: "noopener noreferrer",
      "aria-label": "Chat on WhatsApp",
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 0,
        overflow: "hidden",
        borderRadius: "999px",
        background: "#25D366",
        color: "#fff",
        boxShadow: "0 10px 30px -8px rgba(0,0,0,0.6)",
        transition: "gap 0.3s",
        textDecoration: "none",
        fontFamily: "var(--font-sans)",
        fontSize: "0.875rem",
        fontWeight: 500,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap"
      },
      onMouseEnter: (e) => {
        const span = e.currentTarget.querySelector("[data-label]");
        if (span) {
          span.style.maxWidth = "140px";
          span.style.opacity = "1";
          span.style.paddingRight = "20px";
        }
      },
      onMouseLeave: (e) => {
        const span = e.currentTarget.querySelector("[data-label]");
        if (span) {
          span.style.maxWidth = "0";
          span.style.opacity = "0";
          span.style.paddingRight = "0";
        }
      },
      children: [
        /* @__PURE__ */ jsx11(
          "span",
          {
            style: {
              display: "grid",
              placeItems: "center",
              width: "56px",
              height: "56px",
              flexShrink: 0
            },
            children: /* @__PURE__ */ jsx11(WhatsAppIcon, { style: { width: "28px", height: "28px" } })
          }
        ),
        /* @__PURE__ */ jsx11(
          "span",
          {
            "data-label": "",
            style: {
              maxWidth: 0,
              opacity: 0,
              overflow: "hidden",
              transition: "max-width 0.3s, opacity 0.3s, padding 0.3s"
            },
            children: "Chat with us"
          }
        )
      ]
    }
  );
}

// src/NewsletterForm.tsx
import { useState as useState4 } from "react";
import { jsx as jsx12, jsxs as jsxs8 } from "react/jsx-runtime";
function NewsletterForm({
  source = "ui-kit",
  showPhone = false,
  onSuccess,
  compact = false,
  apiUrl = "/api/subscribe"
}) {
  const [email, setEmail] = useState4("");
  const [phone, setPhone] = useState4("");
  const [status, setStatus] = useState4("idle");
  const [error, setError] = useState4(null);
  async function submit(e) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone: showPhone ? phone : void 0, source })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not subscribe.");
      setStatus("done");
      onSuccess?.();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }
  if (status === "done") {
    return /* @__PURE__ */ jsxs8("p", { style: { fontSize: "0.875rem", lineHeight: 1.6, color: "var(--color-ink-dim)", margin: 0 }, children: [
      "Thank you \u2014 your guide is on its way.",
      " ",
      /* @__PURE__ */ jsx12("span", { style: { color: "var(--color-gold-soft)" }, children: "care@amorfos.in" })
    ] });
  }
  const inputStyle = {
    flex: compact ? "1 1 auto" : void 0
  };
  return /* @__PURE__ */ jsxs8("form", { onSubmit: submit, noValidate: true, style: { display: "flex", flexDirection: "column", gap: "12px" }, children: [
    /* @__PURE__ */ jsxs8(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: compact ? "row" : "column",
          gap: "12px",
          alignItems: compact ? "center" : void 0
        },
        children: [
          /* @__PURE__ */ jsx12(
            "input",
            {
              type: "email",
              required: true,
              value: email,
              onChange: (e) => setEmail(e.target.value),
              placeholder: "Your email",
              autoComplete: "email",
              className: "amf-input",
              style: inputStyle
            }
          ),
          showPhone && /* @__PURE__ */ jsx12(
            "input",
            {
              type: "tel",
              value: phone,
              onChange: (e) => setPhone(e.target.value),
              placeholder: "WhatsApp number (optional)",
              autoComplete: "tel",
              className: "amf-input"
            }
          ),
          /* @__PURE__ */ jsx12(
            "button",
            {
              type: "submit",
              disabled: status === "loading",
              className: "btn btn-primary",
              style: compact ? { flexShrink: 0 } : { width: "100%", opacity: status === "loading" ? 0.6 : 1 },
              children: status === "loading" ? "Sending\u2026" : compact ? "Join" : "Send me the guide"
            }
          )
        ]
      }
    ),
    error && /* @__PURE__ */ jsx12("p", { style: { fontSize: "0.75rem", color: "var(--color-rudra)", margin: 0 }, children: error })
  ] });
}
export {
  ArrowIcon,
  ArticleCard,
  Badge,
  BagIcon,
  Button,
  CheckIcon,
  CloseIcon,
  Eyebrow,
  LeafIcon,
  MenuIcon,
  MinusIcon,
  NewsletterForm,
  PlusIcon,
  ProductCard,
  ReturnIcon,
  Reveal,
  ReviewForm,
  ReviewSection,
  ShieldIcon,
  StarRating,
  TruckIcon,
  WhatsAppButton,
  WhatsAppIcon
};
