// ---------------------------------------------------------------------------
// cloudinary.ts — signed image upload to Cloudinary using the official REST
// API (no SDK dependency). Endpoint: POST /v1_1/<cloud>/image/upload.
//
// Signature scheme (per Cloudinary docs): SHA1 of the alphabetically-sorted
// `key=value` params joined with "&", concatenated with the API secret.
//
// Env (set in .env.local / Vercel):
//   CLOUDINARY_CLOUD_NAME   e.g. "my-salon"
//   CLOUDINARY_API_KEY      from Cloudinary dashboard
//   CLOUDINARY_API_SECRET   from Cloudinary dashboard
//
// When the env vars are present the upload route goes through Cloudinary and
// stores a res.cloudinary.com URL; otherwise it falls back to local disk.
// ---------------------------------------------------------------------------
import { createHash } from 'node:crypto';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? '';
const API_KEY = process.env.CLOUDINARY_API_KEY ?? '';
const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? '';

export function cloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET);
}

function sign(params: Record<string, string>): string {
  const canonical = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(canonical + API_SECRET).digest('hex');
}

export async function cloudinaryUpload(file: File): Promise<string> {
  if (!cloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured (missing env vars)');
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  const params = { timestamp, folder: process.env.CLOUDINARY_FOLDER || 'hair-salon' };
  const signature = sign(params);

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', API_KEY);
  for (const [k, v] of Object.entries(params)) form.append(k, v);
  form.append('signature', signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form }
  );

  let data: { secure_url?: string; error?: { message?: string } };
  try {
    data = await res.json();
  } catch {
    throw new Error(`Cloudinary upload failed (HTTP ${res.status})`);
  }

  if (!res.ok || !data.secure_url) {
    throw new Error(data.error?.message ?? `Cloudinary upload failed (HTTP ${res.status})`);
  }
  return data.secure_url;
}