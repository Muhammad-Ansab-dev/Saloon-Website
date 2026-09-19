// ─────────────────────────────────────────────────────────────
// IMAGE UPLOAD API ("POST /api/admin/upload") — the Media tab's uploader.
// What it does: accepts one image file (multipart form, field "file"),
// stores it, and returns the URL to use on the site.
// What it connects to: Cloudinary (src/lib/cloudinary.ts) when configured;
// otherwise it saves the file to data/uploads/ and the file is served back
// by app/images/cms/[name]/route.ts.
// Why it exists: images need one secure upload path shared by every panel.
// Protected by middleware (matches /api/admin/*); media management is a
// superadmin action — branch managers are rejected here (403).
// Security: only raster image types on the EXT_BY_TYPE whitelist are
// accepted (no SVG, which would be a stored-XSS vector if served inline).
// ─────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cookies } from 'next/headers';
import { cloudinaryConfigured, cloudinaryUpload } from '@/lib/cloudinary';
import { sessionFromRequest } from '@/lib/auth';

// Where local uploads are stored (inside the repo, outside public/)
const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');
// Hard cap: no image bigger than 25 MB
const MAX_BYTES = 25 * 1024 * 1024;
// The only accepted image types and the file extension they map to
const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/png': 'png',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

// Upload handler. Params: multipart request with a "file" field.
// Returns: { ok: true, url } where url is a Cloudinary CDN link or a local
// /images/cms/... path.
export async function POST(request: Request) {
  // Only signed-in users may upload — and only the superadmin, never a branch manager.
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
  // Whitelist check first — an unhandled type is rejected before anything is stored.
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

  // Sanitize the filename (letters/digits/dot/dash only, no extension) and
  // prefix with a timestamp so every name is unique.
  const safeBase = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/\.(webp|png|jpe?g|avif|gif)$/i, '');
  const name = `${Date.now()}-${safeBase || 'image'}.${ext}`;

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  } catch (err) {
    console.error('Upload failed:', err);
    return NextResponse.json({ error: 'Could not save image' }, { status: 500 });
  }

  // Serve the file back through the CMS image route
  return NextResponse.json({ ok: true, url: `/images/cms/${name}` });
}
