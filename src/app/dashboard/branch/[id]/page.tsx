// ─────────────────────────────────────────────────────────────
// Route: /dashboard/branch/[id] — per-branch admin console. Resolves
// the slug against the store's branch rows first (so branches created
// in the Branches tab get a console), falling back to the static
// LOCATIONS entries (e.g. zurich, paris), and mounts
// BranchDashboardShell, which provides the branch's own Overview /
// Bookings / Stylists tabs (reusing the global dashboard panels).
// Protected by middleware (matcher covers /dashboard/:path*); the
// header/footer chrome is suppressed by Providers for any /dashboard
// prefix. Unknown slugs render an inline not-found state.
// ─────────────────────────────────────────────────────────────
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LOCATIONS } from '@/data/salonData';
import { getCollection } from '@/lib/store';
import { BranchDashboardShell } from '@/components/dashboard/BranchDashboardShell';

export default async function BranchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const slug = id.toLowerCase();

  // DB rows are the source of truth for branch consoles (a branch created
  // in the Branches tab must get one). Store errors fall through to the
  // static LOCATIONS fallback so the original consoles keep working when
  // the DB is unreachable.
  let dbBranch: { slug: string; city: string } | null = null;
  try {
    const rows = (await getCollection('branches')) as unknown as { slug: string; city: string }[];
    dbBranch = rows.find((b) => b.slug.toLowerCase() === slug) ?? null;
  } catch {
    dbBranch = null;
  }

  const branch = dbBranch ?? LOCATIONS.find((loc) => loc.city.toLowerCase() === slug);

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