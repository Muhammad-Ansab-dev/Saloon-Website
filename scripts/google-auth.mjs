/**
 * google-auth — one-time OAuth handshake for the Google Calendar booking demo.
 * Run: node scripts/google-auth.mjs
 * It prints an authorize URL; open it in the browser, log in as the salon
 * owner, click Allow, copy the redirect URL's `code` and paste it here.
 * The exchange writes GOOGLE_REFRESH_TOKEN into .env.local.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { loadEnv } from './load-env.mjs';

const env = await loadEnv();

const CLIENT_ID = env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3010';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth' +
  `?client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  '&response_type=code' +
  `&scope=${encodeURIComponent(SCOPES.join(' '))}` +
  '&access_type=offline' +
  '&prompt=consent';

console.log('\n1) Open this URL in your browser and authorize your Google account:\n');
console.log('   ' + authUrl + '\n');

const rl = createInterface({ input: stdin, output: stdout });
let code =
  (await rl.question('2) Paste the full redirect URL you land on (contains ?code=...): ')).trim();

const codeParam = new URL(code).searchParams.get('code');
if (!codeParam) {
  console.error('No ?code= found in that URL. Copy the ENTIRE redirected URL.');
  process.exit(1);
}
rl.close();
code = codeParam;

const res = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  }),
});

const data = await res.json();
if (!data.refresh_token) {
  console.error('\nNo refresh_token returned:', JSON.stringify(data, null, 2));
  console.error('\nTroubleshooting: make sure the OAuth client is type "Desktop app" or has redirect_uri http://localhost:3010 authorized.');
  process.exit(1);
}

const envPath = new URL('../.env.local', import.meta.url).pathname;
let envFile = await readFile(envPath, 'utf8');
envFile = envFile.replace(/GOOGLE_REFRESH_TOKEN=.*/, `GOOGLE_REFRESH_TOKEN=${data.refresh_token}`);
await writeFile(envPath, envFile);

console.log('\nSuccess! GOOGLE_REFRESH_TOKEN written to .env.local.');
console.log('Access token (valid 1h) sample:', data.access_token?.slice(0, 12) + '...');