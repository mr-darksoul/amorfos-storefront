"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { products } from "@/lib/products";
import type { CartLine, Product } from "@/lib/types";

const STORAGE_KEY = "amorfos.cart.v1";

/**
 * Returns a usable Storage only in a real browser. Guards against
 * server rendering and against runtimes (e.g. Node 25) that expose a
 * non-functional `localStorage` global.
 */
function getStore(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const s = window.localStorage;
    if (s && typeof s.getItem === "function") return s;
  } catch {
    /* access may throw in privacy modes */
  }
  return null;
}

type Action =
  | { type: "add"; id: string; qty?: number }
  | { type: "remove"; id: string }
  | { type: "setQty"; id: string; qty: number }
  | { type: "clear" }
  | { type: "hydrate"; lines: CartLine[] };

function reducer(state: CartLine[], action: Action): CartLine[] {
  switch (action.type) {
    case "hydrate":
      return action.lines;
    case "add": {
      const qty = action.qty ?? 1;
      const existing = state.find((l) => l.id === action.id);
      if (existing) {
        return state.map((l) =>
          l.id === action.id ? { ...l, qty: l.qty + qty } : l,
        );
      }
      return [...state, { id: action.id, qty }];
    }
    case "setQty": {
      if (action.qty <= 0) return state.filter((l) => l.id !== action.id);
      return state.map((l) =>
        l.id === action.id ? { ...l, qty: action.qty } : l,
      );
    }
    case "remove":
      return state.filter((l) => l.id !== action.id);
    case "clear":
      return [];
    default:
      return state;
  }
}

export interface CartItem extends CartLine {
  product: Product;
  lineTotal: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (id: string, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, []);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage once on mount.
  useEffect(() => {
    const store = getStore();
    try {
      const raw = store?.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        // Drop any lines whose product no longer exists.
        const valid = parsed.filter((l) => products.some((p) => p.id === l.id));
        dispatch({ type: "hydrate", lines: valid });
      }
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  // Persist on change (after first hydrate so we don't clobber storage).
  useEffect(() => {
    if (!hydrated) return;
    try {
      getStore()?.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage full / unavailable */
    }
  }, [lines, hydrated]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const items: CartItem[] = useMemo(() => {
    return lines
      .map((l) => {
        const product = products.find((p) => p.id === l.id);
        if (!product) return null;
        return { ...l, product, lineTotal: product.price * l.qty };
      })
      .filter((x): x is CartItem => x !== null);
  }, [lines]);

  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((n, i) => n + i.lineTotal, 0);

  const value: CartContextValue = {
    items,
    count,
    subtotal,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    add: (id, qty) => {
      dispatch({ type: "add", id, qty });
      setIsOpen(true);
    },
    remove: (id) => dispatch({ type: "remove", id }),
    setQty: (id, qty) => dispatch({ type: "setQty", id, qty }),
    clear: () => dispatch({ type: "clear" }),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
