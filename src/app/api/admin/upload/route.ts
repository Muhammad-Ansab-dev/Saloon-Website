// ─────────────────────────────────────────────────────────────
// POST /api/admin/upload — admin image upload (multipart form,
// field name "file"). When Cloudinary is configured the image is
// uploaded there and its CDN URL is returned; otherwise it is saved
// to data/uploads/<timestamp>-<name> and served by
// app/images/cms/[name]/route.ts. Protected by middleware
// (matches /api/admin/*).
//
// Only raster image types on the EXT_BY_TYPE whitelist are accepted
// (no SVG, which would be a stored-XSS vector if served inline).
// Media management is a superadmin action: branch managers are rejected
// here (403) even though they have a valid session.
// ─────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cookies } from 'next/headers';
import { cloudinaryConfigured, cloudinaryUpload } from '@/lib/cloudinary';
import { sessionFromRequest } from '@/lib/auth';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');
const MAX_BYTES = 25 * 1024 * 1024;
const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/png': 'png',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

export async function POST(request: Request) {
  const claim = await sessionFromRequest({ cookies: await cookies() });
  if (!claim) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (claim.role === 'branch') {
    return NextResponse.json(
      { error: 'Media management is restricted to the superadmin account' },
      { status: 403 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing "file" field' }, { status: 400 });
  }
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: 'Unsupported image type. Use JPEG, PNG, WebP, AVIF or GIF.' },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be under 25 MB' }, { status: 413 });
  }

  // Cloudinary path — stable URLs that survive serverless cold starts
  if (cloudinaryConfigured()) {
    try {
      const url = await cloudinaryUpload(file);
      return NextResponse.json({ ok: true, url });
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Could not upload image to Cloudinary' },
        { status: 502 }
      );
    }
  }

  const safeBase = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/\.(webp|png|jpe?g|avif|gif)$/i, '');
  const name = `${Date.now()}-${safeBase || 'image'}.${ext}`;

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  } catch (err) {
    console.error('Upload failed:', err);
    return NextResponse.json({ error: 'Could not save image' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: `/images/cms/${name}` });
}
