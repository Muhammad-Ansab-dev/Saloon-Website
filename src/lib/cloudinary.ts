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
// In plain words: files the admin uploads are stored either on Cloudinary's
// servers (recommended) or, if Cloudinary isn't configured, in a local
// data/uploads folder served by /images/cms/[name].
// ---------------------------------------------------------------------------
import { createHash } from 'node:crypto';

// Cloudinary credentials read once at module load. Empty strings mean "not
// configured" and make the upload route fall back to local disk storage.
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? '';
const API_KEY = process.env.CLOUDINARY_API_KEY ?? '';
const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? '';

// True only when all three Cloudinary env vars are present — the flag the
// upload route checks to decide cloud vs. local-disk storage.
export function cloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET);
}

// Build the Cloudinary API signature: a SHA-1 hash of the upload params sorted
// alphabetically as "key=value" pairs (joined with &) plus the API secret.
// Cloudinary requires this so nothing can be uploaded without knowing the
// secret. Params: params — the upload parameters to sign. Returns the hex digest.
function sign(params: Record<string, string>): string {
  const canonical = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(canonical + API_SECRET).digest('hex');
}

// Upload an image file to Cloudinary and return its secure CDN URL.
// Params: file — the image to upload. Returns the https:// URL of the stored
// asset. Throws when Cloudinary isn't configured or the API returns an error.
export async function cloudinaryUpload(file: File): Promise<string> {
  if (!cloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured (missing env vars)');
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  const params = { timestamp, folder: process.env.CLOUDINARY_FOLDER || 'hair-salon' };
  const signature = sign(params);

  // Cloudinary expects an epoch-second timestamp plus the target folder in a
  // signed param set, then all of that posted as form fields alongside the file.
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