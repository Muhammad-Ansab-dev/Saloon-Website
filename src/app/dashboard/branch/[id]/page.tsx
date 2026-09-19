// ─────────────────────────────────────────────────────────────
// BRANCH CONSOLE ROUTE ("/dashboard/branch/[id]") — each branch
// manager's own admin console.
// What it does: resolves the URL slug to a branch, then mounts the shared
// BranchDashboardShell for that branch (Overview / Bookings / Stylists tabs
// scoped to this one branch).
// What it connects to: the store's branches collection (DB rows are the
// source of truth for which consoles exist), the static LOCATIONS fallback
// (src/data/salonData.ts), and <BranchDashboardShell>
// (src/components/dashboard/BranchDashboardShell.tsx).
// Why it exists: middleware already bounces branch managers to this console;
// this page just finds the right branch and renders it. Unknown slugs
// render an inline "Branch not found" state.
// ─────────────────────────────────────────────────────────────
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LOCATIONS } from '@/data/salonData';
import { getCollection } from '@/lib/store';
import { BranchDashboardShell } from '@/components/dashboard/BranchDashboardShell';

// Server component for a branch console.
// Params: { id } — the branch slug from the URL (awaited; may be e.g. "zurich").
// Returns: <BranchDashboardShell> for a known branch, or an inline
// not-found page for an unknown slug.
export default async function BranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Compare case-insensitively, since slugs come from the URL
  const slug = id.toLowerCase();

  // Resolve the branch: DB rows first (a branch added in the Branches tab
  // must get a console). Store errors fall through to the static LOCATIONS
  // fallback so the original consoles keep working when the DB is down.
  let dbBranch: { slug: string; city: string } | null = null;
  try {
    const rows = (await getCollection('branches')) as unknown as { slug: string; city: string }[];
    dbBranch = rows.find((b) => b.slug.toLowerCase() === slug) ?? null;
  } catch {
    dbBranch = null;
  }

  // Prefer the DB row; otherwise the matching static LOCATIONS entry
  const branch = dbBranch ?? LOCATIONS.find((loc) => loc.city.toLowerCase() === slug);

  // Unknown slug → show a friendly not-found page with a link back
  if (!branch) {
    return (
      <div className="dark h-screen overflow-y-auto bg-background text-foreground">
        <div className="mx-auto w-full max-w-[1500px] px-6 py-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
          </Link>
          <h1 className="font-editorial text-3xl font-black uppercase tracking-tight mt-4">
            Branch not found
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            No branch matches “{id}” — check the Branches tab to see available studios.
          </p>
        </div>
      </div>
    );
  }

  return <BranchDashboardShell branchId={slug} branchName={branch.city} />;
}