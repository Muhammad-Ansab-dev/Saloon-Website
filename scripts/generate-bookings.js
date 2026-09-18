// generate-bookings.js — wipes bookings + stylists and rebuilds them from the
// website's canonical data: stylists re-seeded in their site order with branch
// assignments (zurich / paris), and new bookings linked to those branches via
// the stylist each booking is assigned to.
const { Client } = require('pg');
const c = new Client({ connectionString: 'postgres://salon:salon_dev_2026@localhost:5432/salon' });

const SERVICES = [
  ["srv-1",  "HAIRCUT WITH BLOW DRY", 15],
  ["srv-2",  "BLOW DRY & CURL",        10],
  ["srv-3",  "SHAMPOO & SET",           8],
  ["srv-4",  "HAIRCUT WITH HIGHLIGHTS",10],
  ["srv-5",  "HAIRCUT & CURL",         10],
  ["srv-6",  "BEARD SCULPT & SHAPE",    7],
  ["srv-7",  "GLAZE & GLOSS",           6],
  ["srv-8",  "DEEP CONDITIONING RITUAL",4],
  ["srv-9",  "EDITORIAL UPDO",          3],
  ["srv-10", "BALAYAGE & TONER",        8],
  ["srv-11", "CURL REVIVAL SET",        5],
  ["srv-12", "CORPORATE BLOW DRY",      4],
];

// id, name, weight, branch — mirrors src/data/salonData.ts STYLISTS.
const STYLISTS = [
  ["paul",   "Paul Delacroix",     25, "zurich"],
  ["claire", "Claire Moreau",      14, "zurich"],
  ["lucas",  "Lucas Stern",        12, "zurich"],
  ["sophie", "Sophie Weber",       15, "zurich"],
  ["lena",   "Lena Fischer",        8, "zurich"],
  ["marc",   "Marc Dubois",         8, "paris"],
  ["amelie", "Amélie Rousseau",     8, "paris"],
  ["nina",   "Nina Vogel",         10, "paris"],
];

// Real roles from the public site (src/data/salonData.ts).
const STYLIST_ROLES = {
  paul: 'Creative Director & Master Stylist',
  claire: 'Senior Colorist & Balayage Specialist',
  lucas: 'Master Barber & Texture Expert',
  sophie: 'Editorial Stylist & Scalp Specialist',
  lena: 'Junior Stylist & Colourist',
  marc: 'Apprentice Barber',
  amelie: 'Trainee & Scalp Therapist',
  nina: 'Colourist & Bridal Specialist',
};

const FIRST = ["Emma","Liam","Olivia","Noah","Ava","William","Sophia","James","Isabella","Oliver","Mia","Benjamin","Charlotte","Elijah","Amelia","Lucas","Harper","Mason","Evelyn","Logan","Abigail","Alexander","Emily","Ethan","Ella","Jacob","Scarlett","Michael","Grace","Daniel","Luna","Henry","Chloe","Sebastian","Penelope","Jack","Aria","Aiden","Layla","Owen","Riley","Samuel","Zoey","Ryan","Nora","Nathan","Lily","Caleb","Eleanor","Christian","Hannah","Dylan","Lillian","Joshua","Addison","Isaac","Aubrey","Andrew","Ellie","Thomas","Stella","Gabriel","Natalie","Anthony","Zoe","Charles","Leah","Christopher","Hazel","Jasper","Violet","Jayden","Aurora","Lincoln","Savannah","Hugo","Audrey","Isaiah","Brooklyn","Leo","Bella","Asher","Claire","Jack","Skylar","Julian","Lucy","Mateo","Paisley","David","Anna","Joseph","Caroline","Carter","Nova","Luke","Genesis","Kai","Maya","Wyatt","Willow","Elias","Naomi","Archer","Aaliyah","Jonathan","Elena","Luka","Sofia","Ravi","Noor","Arjun","Priya","Viktor","Mila"];
const LAST = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts","Muller","Fischer","Weber","Schneider","Meyer","Wagner","Becker","Schulz","Koch","Bauer","Richter","Klein","Wolf","Neumann","Zimmermann","Singh","Patel","Kumar","Shah","Chen","Wang","Li","Kim","Park","Tanaka","Silva","Santos","Oliveira","Costa","Fernandez","Morales","Vargas","Gutierrez","Mendoza","Ruiz","Alvarez","Romero","Moreno","Aguilar","Medina","Dominguez","Castillo","Ortega","Ramos","Guerrero","Soto","Esquivel","Maldonado","Espinoza","Corrales","Paredes"];

// Static stylist image URLs (mirrors STYLIST_IMAGE_BY_ID) — used so the
// re-seeded roster shows the same portraits as the public site.
const STYLIST_IMAGES = {
  paul: 'https://res.cloudinary.com/dittrfbja/image/upload/v1789651072/hair-salon/hair-hero1.webp',
  claire: 'https://res.cloudinary.com/dittrfbja/image/upload/v1789651073/hair-salon/hair-hero2.webp',
  lucas: 'https://res.cloudinary.com/dittrfbja/image/upload/v1789650820/hair-salon/hair-hero3.webp',
  sophie: 'https://res.cloudinary.com/dittrfbja/image/upload/v1789650832/hair-salon/lookbook-3.webp',
  lena: 'https://res.cloudinary.com/dittrfbja/image/upload/v1789650824/hair-salon/instagram-2.webp',
  marc: 'https://res.cloudinary.com/dittrfbja/image/upload/v1789650820/hair-salon/hair-service1.webp',
  amelie: 'https://res.cloudinary.com/dittrfbja/image/upload/v1789650833/hair-salon/press-1.webp',
  nina: 'https://res.cloudinary.com/dittrfbja/image/upload/v1789650830/hair-salon/lookbook-1.webp',
};

const HOURS_KEY = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30"];
const HOURS_SAT = ["10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30"];
const NOTES = ["First-time client","Regular","VIP","Referred by friend","Birthday week","Traveling from Zurich","Prefers same stylist","Student discount","Corporate account","Gift voucher","Allergic to ammonia — use ammonia-free colour","Sensitive scalp","Just moved to the area","Wants quiet salon visit (no blowdry)","Bringing daughter along"];

let seed = 20260918;
function rng() { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const pick = (a) => a[Math.floor(rng() * a.length)];
function weighted(list) { const total = list.reduce((s, x) => s + x[2], 0); let r = rng() * total; for (const x of list) { r -= x[2]; if (r <= 0) return x; } return list[list.length - 1]; }
const uid = () => "bk-" + Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8);

function dateRange(start, end) {
  const days = [];
  const d = new Date(start), e = new Date(end);
  while (d <= e) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return days;
}

function statusFor(daysAgo, isUpcoming) {
  if (isUpcoming) return pick(["confirmed", "confirmed", "pending"]);
  if (daysAgo > 60) return pick(["completed", "completed", "completed", "cancelled"]);
  if (daysAgo > 14) return pick(["completed", "completed", "completed", "completed", "confirmed", "cancelled"]);
  if (daysAgo > 0) return pick(["completed", "confirmed", "confirmed", "pending"]);
  return pick(["confirmed", "confirmed", "pending"]);
}

function makeRow(days) {
  const day = pick(days);
  const hours = day.getDay() === 6 ? HOURS_SAT : HOURS_KEY;
  const time = pick(hours);
  const svc = weighted(SERVICES);
  const sty = weighted(STYLISTS);
  const first = pick(FIRST), last = pick(LAST);
  const email = first.toLowerCase() + "." + last.toLowerCase() + Math.floor(rng() * 99) + "@example.com";
  const phone = "+41 " + pick([76, 78, 79, 44, 31, 22, 32, 41, 52, 61]) + " " + Math.floor(100 + rng() * 900) + " " + Math.floor(10 + rng() * 90);
  const daysAgo = Math.floor((Date.now() - day.getTime()) / 86400000);
  const notes = rng() > 0.72 ? pick(NOTES) : "";
  // Bookings inherit their branch from the stylist they are assigned to.
  const branch = sty[3];
  return [uid(), svc[0], svc[1], sty[0], sty[1], branch, day.toISOString().split("T")[0], time, first + " " + last, email, phone, notes, statusFor(daysAgo, daysAgo < 0)];
}

(async () => {
  await c.connect();

  // Cap image URLs from the live rows before wiping (falls back to the
  // static map if a row is already missing).
  const prevImgs = {};
  const prev = await c.query("SELECT id, image FROM stylists");
  for (const r of prev.rows) prevImgs[r.id] = r.image;
  const img = (id) => prevImgs[id] || STYLIST_IMAGES[id] || "";

  await c.query("DELETE FROM bookings");
  await c.query("DELETE FROM stylists");

  // Re-seed stylists in the website's canonical order with branch + portrait.
  for (let i = 0; i < STYLISTS.length; i++) {
    const st = STYLISTS[i];
    await c.query(
      `INSERT INTO stylists (id, name, role, image, branch, sort_order) VALUES ($1,$2,$3,$4,$5,$6)`,
      [st[0], st[1], STYLIST_ROLES[st[0]], img(st[0]), st[3], i]
    );
  }
  console.log("re-seeded", STYLISTS.length, "stylists (zurich:", STYLISTS.filter((s) => s[3] === 'zurich').length, "· paris:", STYLISTS.filter((s) => s[3] === 'paris').length, ")");

  // Generate bookings across both branches.
  const days = dateRange("2026-02-01", "2026-12-31").filter((d) => d.getDay() !== 0);
  const rows = [];
  while (rows.length < 1000) {
    const r = makeRow(days);
    if (!rows.some((x) => x[4] === r[4] && x[6] === r[6] && x[7] === r[7])) rows.push(r);
  }

  const q = "INSERT INTO bookings (id,service_id,service_name,stylist_name,branch,date,time,client_name,client_email,client_phone,notes,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)";
  for (const r of rows) await c.query(q, [r[0], r[1], r[2], r[4], r[5], r[6], r[7], r[8], r[9], r[10], r[11], r[12]]);
  console.log("inserted", rows.length, "bookings");

  const st = await c.query("SELECT status, count(*)::int AS n FROM bookings GROUP BY status ORDER BY n DESC");
  console.log("status:", st.rows.map((r) => r.status + ":" + r.n).join("  "));
  const br = await c.query("SELECT branch, count(*)::int AS n FROM bookings GROUP BY branch ORDER BY n DESC");
  console.log("branch:", br.rows.map((r) => (r.branch || '(none)') + ":" + r.n).join("  "));
  const bStillOpen = await c.query("SELECT count(*)::int AS n FROM bookings WHERE branch=''");
  if (bStillOpen.rows[0].n > 0) console.log("WARNING: bookings missing branch:", bStillOpen.rows[0].n);
  const svc = await c.query("SELECT count(DISTINCT service_id) AS s, count(DISTINCT stylist_name) AS sy FROM bookings");
  console.log("distinct services:", svc.rows[0].s, "distinct stylists:", svc.rows[0].sy);
  const probe = await c.query("SELECT service_name, stylist_name, branch, date, time, client_name, status FROM bookings ORDER BY date DESC, time DESC LIMIT 5");
  probe.rows.forEach((r) => console.log(" e.g.", r.date, r.time, r.service_name, "|", r.stylist_name, "|", r.branch, "|", r.client_name, "|", r.status));
  await c.end();
})();