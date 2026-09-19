// ─────────────────────────────────────────────────────────────
// utils.ts — shared little helpers for the whole app. Today it re-exports
// `cn`, the class-name merger used by our UI primitives to combine Tailwind
// classes (e.g. a component's default classes plus the caller's extras).
// Re-exporting it from this stable local path gives every component one
// consistent place to import it from.
// ─────────────────────────────────────────────────────────────

// Merge Tailwind class names — see the header above for what it's used for.
export { cn } from "cn"
