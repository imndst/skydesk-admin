import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { randomBytes } from 'node:crypto'
import { hashPassword } from './auth'

type Db = Database.Database
let db: Db | null = null
const cache = new Map<string, Database.Statement>()

/** Cached prepared statements. SQL text is ALWAYS static; user input is ALWAYS a bound parameter. */
export function stmt(sql: string) {
  let s = cache.get(sql)
  if (!s) { s = getDb().prepare(sql); cache.set(sql, s) }
  return s
}

export function getDb(): Db {
  if (db) return db
  const file = process.env.DATABASE_FILE || './data/skydesk.db'
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true })
  db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('foreign_keys = ON')
  migrate(db)
  seed(db)
  return db
}

const SCHEMA_VERSION = 2

function migrate(d: Db) {
  const v = d.pragma('user_version', { simple: true }) as number
  if (v !== SCHEMA_VERSION) {
    // Demo database: on a schema change we rebuild from scratch (v1 stored USD cents, v2 stores Toman).
    d.exec(`DROP TABLE IF EXISTS bookings; DROP TABLE IF EXISTS flights; DROP TABLE IF EXISTS hotels;
      DROP TABLE IF EXISTS settings; DROP TABLE IF EXISTS users;`)
  }
  d.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY, value TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), updated_by TEXT);
  CREATE TABLE IF NOT EXISTS flights (
    id INTEGER PRIMARY KEY, airline TEXT NOT NULL, flight_number TEXT NOT NULL,
    origin TEXT NOT NULL, destination TEXT NOT NULL, departure_at TEXT NOT NULL, arrival_at TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price > 0),
    seats_total INTEGER NOT NULL CHECK (seats_total > 0),
    seats_available INTEGER NOT NULL,
    CHECK (seats_available >= 0 AND seats_available <= seats_total));
  CREATE TABLE IF NOT EXISTS hotels (
    id INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL, country TEXT NOT NULL,
    stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
    price INTEGER NOT NULL CHECK (price > 0),
    rooms_total INTEGER NOT NULL CHECK (rooms_total > 0),
    rooms_available INTEGER NOT NULL,
    CHECK (rooms_available >= 0 AND rooms_available <= rooms_total));
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY, reference TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('flight','hotel')),
    flight_id INTEGER REFERENCES flights(id) ON DELETE RESTRICT,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE RESTRICT,
    customer_name TEXT NOT NULL, customer_email TEXT NOT NULL, customer_phone TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 9),
    check_in TEXT, check_out TEXT,
    total INTEGER NOT NULL CHECK (total > 0),
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    CHECK ((type='flight' AND flight_id IS NOT NULL AND hotel_id IS NULL) OR (type='hotel' AND hotel_id IS NOT NULL AND flight_id IS NULL)));
  CREATE INDEX IF NOT EXISTS idx_flights_dep ON flights(departure_at);
  CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at);
  CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
  `)
  d.pragma(`user_version = ${SCHEMA_VERSION}`)
}

export function newReference() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(8)
  return 'SD-' + Array.from(bytes, b => alphabet[b % alphabet.length]).join('')
}

const pad = (n: number) => String(n).padStart(2, '0')
const localIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

function seed(d: Db) {
  const { c } = d.prepare('SELECT COUNT(*) c FROM users').get() as { c: number }
  if (c > 0) return
  const email = (process.env.ADMIN_EMAIL || 'admin@skydesk.demo').toLowerCase()
  const password = process.env.ADMIN_PASSWORD || 'Admin#2026demo'
  d.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, hashPassword(password))
  if (process.env.SEED_DEMO_DATA === '0') return

  const day = 86_400_000
  const now = Date.now()
  const flights: [string, string, string, string, number, number, number][] = [
    ['ایران ایر', 'IR452', 'THR', 'MHD', 2, 1.5, 2_850_000],
    ['ماهان', 'W51063', 'THR', 'KIH', 3, 1.75, 3_400_000],
    ['آسمان', 'EP3801', 'MHD', 'SYZ', 4, 1.5, 2_950_000],
    ['کاسپین', 'IV6512', 'IFN', 'MHD', 5, 1.5, 2_700_000],
    ['زاگرس', 'ZV4021', 'THR', 'AWZ', 2, 1.25, 2_600_000],
    ['قشم ایر', 'QB1225', 'IKA', 'DXB', 6, 2, 9_800_000],
    ['وارش', 'VR6003', 'THR', 'RAS', 7, 1, 1_950_000],
    ['معراج', 'JI1082', 'MHD', 'THR', 3, 1.5, 2_850_000],
    ['کیش ایر', 'Y92311', 'KIH', 'THR', 8, 1.75, 3_200_000],
    ['ایران ایرتور', 'B92802', 'SYZ', 'THR', 9, 1.25, 2_400_000],
    ['تابان', 'HH6287', 'THR', 'TBZ', 10, 1.25, 2_300_000],
    ['ماهان', 'W5116', 'IKA', 'IST', 11, 3.5, 14_500_000]
  ]
  const insF = d.prepare('INSERT INTO flights (airline, flight_number, origin, destination, departure_at, arrival_at, price, seats_total, seats_available) VALUES (?,?,?,?,?,?,?,?,?)')
  flights.forEach(([a, n, o, de, inDays, hours, price], i) => {
    const dep = new Date(now + inDays * day); dep.setHours(6 + (i * 3) % 16, (i % 4) * 15, 0, 0)
    const arr = new Date(dep.getTime() + hours * 3_600_000)
    const total = 120 + i * 18
    insF.run(a, n, o, de, localIso(dep), localIso(arr), price, total, total)
  })
  const hotels: [string, string, string, number, number, number][] = [
    ['هتل بین‌المللی هما ۲', 'مشهد', 'ایران', 5, 4_830_210, 120],
    ['هتل بین‌المللی قصر', 'مشهد', 'ایران', 5, 6_200_000, 200],
    ['هتل درویشی', 'مشهد', 'ایران', 5, 7_450_000, 180],
    ['هتل اسپیناس پالاس', 'تهران', 'ایران', 5, 9_800_000, 300],
    ['هتل پارسیان آزادی', 'تهران', 'ایران', 5, 8_900_000, 250],
    ['هتل عباسی', 'اصفهان', 'ایران', 5, 7_100_000, 220],
    ['هتل زندیه', 'شیراز', 'ایران', 5, 6_400_000, 160],
    ['هتل ترنج', 'کیش', 'ایران', 5, 8_200_000, 140],
    ['هتل پارس ائل‌گلی', 'تبریز', 'ایران', 5, 4_900_000, 190],
    ['هتل آپارتمان رضوان', 'مشهد', 'ایران', 3, 1_950_000, 60]
  ]
  const insH = d.prepare('INSERT INTO hotels (name, city, country, stars, price, rooms_total, rooms_available) VALUES (?,?,?,?,?,?,?)')
  hotels.forEach(([n, ci, co, s, p, r]) => insH.run(n, ci, co, s, p, r, r))

  const names = ['سارا محمدی', 'علی رضایی', 'مینا رحیمی', 'حسین کریمی', 'نگار احمدی', 'رضا موسوی', 'الهام نوری', 'امیر حسینی', 'زهرا صادقی', 'کاوه دمیرچی']
  const insB = d.prepare(`INSERT INTO bookings (reference, type, flight_id, hotel_id, customer_name, customer_email, customer_phone, quantity, check_in, check_out, total, status, created_at)
    VALUES (@reference,@type,@flight_id,@hotel_id,@name,@email,@phone,@qty,@ci,@co,@total,@status,@created)`)
  const takeSeats = d.prepare('UPDATE flights SET seats_available = seats_available - ? WHERE id = ?')
  const takeRooms = d.prepare('UPDATE hotels SET rooms_available = rooms_available - ? WHERE id = ?')
  for (let i = 0; i < 28; i++) {
    const name = names[i % names.length]!
    const created = new Date(now - (i % 7) * day - (i * 41) * 60_000).toISOString()
    const status = i % 9 === 4 ? 'cancelled' : 'confirmed'
    const base = { reference: newReference(), name, email: `guest${i + 1}@example.com`, phone: `0912 555 01${pad(i)}`, created, status }
    if (i % 3 !== 0) {
      const f = flights[i % flights.length]!; const qty = 1 + (i % 3); const fid = (i % flights.length) + 1
      insB.run({ ...base, type: 'flight', flight_id: fid, hotel_id: null, qty, ci: null, co: null, total: f[6] * qty })
      if (status === 'confirmed') takeSeats.run(qty, fid)
    } else {
      const h = hotels[i % hotels.length]!; const nights = 1 + (i % 4); const hid = (i % hotels.length) + 1
      const ci = new Date(now + (2 + i % 5) * day); const co = new Date(ci.getTime() + nights * day)
      insB.run({ ...base, type: 'hotel', flight_id: null, hotel_id: hid, qty: 1, ci: ci.toISOString().slice(0, 10), co: co.toISOString().slice(0, 10), total: h[4] * nights })
      if (status === 'confirmed') takeRooms.run(1, hid)
    }
  }
}
