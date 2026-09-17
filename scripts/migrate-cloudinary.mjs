// ---------------------------------------------------------------------------
// migrate-cloudinary.mjs — one-time migration: upload every local site asset
// (public/images/*, public/videos/*, data/uploads/*) to Cloudinary and repoint
// the DB rows (services, stylists, gallery, site_images) at the CDN URLs.
//
// Run: node scripts/migrate-cloudinary.mjs
// Idempotent: same public_id + overwrite:true → reruns replace, no duplicates.
// ---------------------------------------------------------------------------
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FOLDER = 'hair-salon';

// --- env ----------------------------------------------------------------
const env = {};
for (const line of readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}
const CLOUD = env.CLOUDINARY_CLOUD_NAME;
const API_KEY = env.CLOUDINARY_API_KEY;
const API_SECRET = env.CLOUDINARY_API_SECRET;
const DATABASE_URL = env.DATABASE_URL ?? 'postgres://salon:salon_dev_2026@localhost:5432/salon';

for (const [k, v] of [['CLOUDINARY_CLOUD_NAME', CLOUD], ['CLOUDINARY_API_KEY', API_KEY], ['CLOUDINARY_API_SECRET', API_SECRET]]) {
  if (!v) { console.error(`Missing ${k} in .env.local`); process.exit(1); }
}

const sign = (params) =>
  createHash('sha1')
    .update(
      Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&') + API_SECRET
    )
    .digest('hex');

const MIME = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', avif: 'image/avif', gif: 'image/gif', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };

async function upload(filePath, resourceType) {
  const base = path.basename(filePath);
  const publicId = base.replace(/\.[^.]+$/, '');
  const timestamp = String(Math.floor(Date.now() / 1000));
  const params = { timestamp, folder: FOLDER, public_id: publicId, overwrite: 'true' };
  const signature = sign(params);

  const form = new FormData();
  form.append('file', new Blob([readFileSync(filePath)], { type: MIME[path.extname(base).slice(1)] ?? 'image/png' }), base);
  form.append('api_key', API_KEY);
  for (const [k, v] of Object.entries(params)) form.append(k, v);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/${resourceType}/upload`, { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok || !data.secure_url) throw new Error(`${base}: ${data.error?.message ?? `HTTP ${res.status}`}`);
  return data.secure_url;
}

// --- gather local assets -------------------------------------------------
const imagesDir = path.join(ROOT, 'public', 'images');
const videosDir = path.join(ROOT, 'public', 'videos');
const uploadsDir = path.join(ROOT, 'data', 'uploads');
const IMG_RE = /\.(webp|png|jpe?g|avif|gif)$/i;
const VID_RE = /\.(mp4|webm|mov)$/i;

const local = new Map(); // local URL path -> file path
for (const f of readdirSync(imagesDir)) if (IMG_RE.test(f)) local.set(`/images/${f}`, path.join(imagesDir, f));
for (const f of readdirSync(videosDir)) if (IMG_RE.test(f)) local.set(`/videos/${f}`, path.join(videosDir, f));
if (process.env.NODE_ENV !== 'test') {
  try { for (const f of readdirSync(uploadsDir)) if (IMG_RE.test(f)) local.set(`/images/cms/${f}`, path.join(uploadsDir, f)); }
  catch {}
}

// --- upload all -----------------------------------------------------------
const map = new Map(); // local URL path -> cloudinary URL
for (const [localUrl, filePath] of local) {
  const isVideo = VID_RE.test(filePath);
  try {
    const url = await upload(filePath, isVideo ? 'video' : 'image');
    map.set(localUrl, url);
    console.log(`OK  ${isVideo ? 'video' : 'image'}  ${localUrl.padEnd(40)} -> ${url}`);
  } catch (e) {
    console.error(`ERR ${localUrl}: ${e.message}`);
  }
}
console.log(`\nuploaded ${map.size}/${local.size} assets\n`);

// --- repoint DB rows ------------------------------------------------------
const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();
const tables = [
  ['services', 'id', 'image'],
  ['stylists', 'id', 'image'],
  ['gallery', 'id', 'image'],
  ['site_images', 'image_key', 'image_url'],
];
for (const [table, idCol, imgCol] of tables) {
  const { rows } = await client.query(`SELECT ${idCol} AS id, ${imgCol} AS img FROM ${table}`);
  let changed = 0;
  for (const row of rows) {
    const cloudUrl = map.get(row.img);
    if (cloudUrl) {
      await client.query(`UPDATE ${table} SET ${imgCol} = $1 WHERE ${idCol} = $2`, [cloudUrl, row.id]);
      changed++;
    }
  }
  console.log(`${table}: ${changed}/${rows.length} rows repointed`);
}
await client.end();
console.log('\ndone');