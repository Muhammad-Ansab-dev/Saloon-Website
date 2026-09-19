// ─────────────────────────────────────────────────────────────
// CMS IMAGE ROUTE ("GET /images/cms/[name]") — streams back locally
// uploaded images so the browser can display them.
// What it does: reads the file from data/uploads/ and returns it with the
// right content type, cache header, and nosniff guard.
// What it connects to: the data/uploads/ folder (written by
// POST /api/admin/upload when Cloudinary is not configured).
// Why it exists: files written inside public/ at runtime are NOT served by
// `next start` (public is snapshotted at build time), so uploads live
// outside public and are read here instead.
// Security: only a bare filename is accepted (no ".." paths) and
// X-Content-Type-Options: nosniff stops browsers from sniffing a different
// type than the one we declare.
// ─────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

// Where local uploads are stored (same folder the upload API writes to)
const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');

// File extension → the MIME type we serve for it.
const TYPE_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  png: 'image/png',
  avif: 'image/avif',
  gif: 'image/gif',
};

// Never cache the route itself server-side (files change as admins upload).
export const dynamic = 'force-dynamic';

// Image handler. Params: the [name] URL segment (the uploaded filename).
// Returns: the raw image bytes (or a 404 when the file is missing/invalid).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  // Path-traversal guard: only a plain filename is allowed, never a path.
  const safe = path.basename(name);
  if (safe !== name) {
    return new NextResponse('Not found', { status: 404 });
  }
  const filePath = path.join(UPLOAD_DIR, safe);
  // Second guard: the resolved path must still live inside UPLOAD_DIR.
  if (!filePath.startsWith(`${UPLOAD_DIR}${path.sep}`)) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    // Only real files are served — directories and missing entries 404.
    const info = await stat(filePath);
    if (!info.isFile()) {
      return new NextResponse('Not found', { status: 404 });
    }
    const data = await readFile(filePath);
    const ext = path.extname(safe).slice(1).toLowerCase();
    return new NextResponse(data, {
      headers: {
        'Content-Type': TYPE_BY_EXT[ext] ?? 'application/octet-stream',
        // nosniff: never let the browser guess a different type
        'X-Content-Type-Options': 'nosniff',
        // Images never change once uploaded → cache them for a year
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}