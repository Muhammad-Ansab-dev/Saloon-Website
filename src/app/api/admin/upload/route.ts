import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cloudinaryConfigured, cloudinaryUpload } from '@/lib/cloudinary';

// POST /api/admin/upload  (multipart form, field name "file")
// Saves to data/uploads/<timestamp>-<name> and returns { url }. The file is
// served at that URL by the GET handler in app/images/cms/[name]/route.ts.
// Protected by middleware (matches /api/admin/*).
const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');
const MAX_BYTES = 25 * 1024 * 1024;
const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/png': 'png',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

// POST /api/admin/upload  (multipart form, field name "file")
// Saves to public/images/cms/<timestamp>-<name> and returns { url }.
// Protected by middleware (matches /api/admin/*).
export async function POST(request: Request) {
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
  if (!file.type || !file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
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

  const ext = EXT_BY_TYPE[file.type] ?? (path.extname(file.name).slice(1) || 'bin');
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