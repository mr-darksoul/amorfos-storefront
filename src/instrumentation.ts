/**
 * Runs once when the Node server boots (Next.js calls this automatically).
 *
 * Node 22+/25 expose a global `localStorage` (and `sessionStorage`) that is
 * non-functional unless the process is started with a `--localstorage-file`.
 * Its methods are `undefined`, so any dependency that feature-detects storage
 * with `typeof localStorage !== "undefined"` and then calls `getItem` crashes
 * during server rendering. We remove the broken global so SSR sees no storage.
 *
 * On platforms running older Node (e.g. Vercel's Node 20) the global doesn't
 * exist and this is a harmless no-op.
 */
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const g = globalThis as Record<string, unknown>;
    const ls = g.localStorage as { getItem?: unknown } | undefined;
    if (ls && typeof ls.getItem !== "function") {
      delete g.localStorage;
      delete g.sessionStorage;
    }
  } catch {
    /* nothing to clean up */
  }
}
