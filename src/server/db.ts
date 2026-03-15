import Database from "better-sqlite3"
import fs from "fs"
import path from "path"

const dataDir = path.join(process.cwd(), "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, "app.db")
const db = new Database(dbPath)
db.pragma("journal_mode = WAL")

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT NOT NULL,
    avatar TEXT,
    role TEXT NOT NULL,
    family_id TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS families (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    admin_id TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS babies (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    gender TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS feeding_records (
    id TEXT PRIMARY KEY,
    baby_id TEXT NOT NULL,
    family_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    member_name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    feeding_time TEXT NOT NULL,
    duration_minutes INTEGER,
    note TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    baby_id TEXT NOT NULL,
    family_id TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    baby_id TEXT NOT NULL,
    family_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS growth_records (
    id TEXT PRIMARY KEY,
    baby_id TEXT NOT NULL,
    family_id TEXT NOT NULL,
    height REAL NOT NULL,
    weight REAL NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS vaccine_reminders (
    id TEXT PRIMARY KEY,
    baby_id TEXT NOT NULL,
    family_id TEXT NOT NULL,
    name TEXT NOT NULL,
    due_date TEXT NOT NULL,
    is_completed INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS feeding_reminders (
    id TEXT PRIMARY KEY,
    baby_id TEXT NOT NULL,
    family_id TEXT NOT NULL,
    suggested_time TEXT NOT NULL,
    is_completed INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);
  CREATE INDEX IF NOT EXISTS idx_babies_family_id ON babies(family_id);
  CREATE INDEX IF NOT EXISTS idx_feeding_family_id ON feeding_records(family_id);
  CREATE INDEX IF NOT EXISTS idx_photos_baby_id ON photos(baby_id);
  CREATE INDEX IF NOT EXISTS idx_milestones_baby_id ON milestones(baby_id);
  CREATE INDEX IF NOT EXISTS idx_growth_baby_id ON growth_records(baby_id);
  CREATE INDEX IF NOT EXISTS idx_vaccine_family_id ON vaccine_reminders(family_id);
  CREATE INDEX IF NOT EXISTS idx_feeding_reminders_family_id ON feeding_reminders(family_id);
`)

export default db
