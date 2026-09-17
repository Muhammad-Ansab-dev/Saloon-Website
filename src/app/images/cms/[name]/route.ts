// ─────────────────────────────────────────────────────────────
// GET /images/cms/[name] — streams runtime-uploaded images from
// data/uploads. Files written under public/ at runtime are not
// served by `next start` (public is snapshotted at build time), so
// uploads live outside public and are read here instead. Sends
// X-Content-Type-Options: nosniff so browsers never sniff a
// different type than the whitelisted one we declare.
// ─────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');

const TYPE_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  png: 'image/png',
  avif: 'image/avif',
  gif: 'image/gif',
};

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const safe = path.basename(name);
  if (safe !== name) {
    return new NextResponse('Not found', { status: 404 });
  }
  const filePath = path.join(UPLOAD_DIR, safe);
  if (!filePath.startsWith(`${UPLOAD_DIR}${path.sep}`)) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      return new NextResponse('Not found', { status: 404 });
    }
    const data = await readFile(filePath);
    const ext = path.extname(safe).slice(1).toLowerCase();
    return new NextResponse(data, {
      headers: {
        'Content-Type': TYPE_BY_EXT[ext] ?? 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}