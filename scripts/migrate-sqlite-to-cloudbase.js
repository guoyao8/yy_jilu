const cloudbase = require("@cloudbase/node-sdk")
const Database = require("better-sqlite3")
const path = require("path")
const fs = require("fs")

const env = process.env.CLOUDBASE_ENV_ID
const secretId = process.env.CLOUDBASE_SECRET_ID
const secretKey = process.env.CLOUDBASE_SECRET_KEY

if (!env || !secretId || !secretKey) {
  throw new Error("CLOUDBASE 环境变量未配置")
}

const dbPath =
  process.env.SQLITE_DB_PATH || path.join(process.cwd(), "data", "app.db")

if (!fs.existsSync(dbPath)) {
  throw new Error(`SQLite 文件不存在: ${dbPath}`)
}

const sqlite = new Database(dbPath)
const app = cloudbase.init({ env, secretId, secretKey })
const cloudDb = app.database()

const mappers = {
  users: (row) => ({
    id: row.id,
    phone: row.phone,
    password: row.password,
    nickname: row.nickname,
    avatar: row.avatar || null,
    role: row.role,
    familyId: row.family_id || null,
    createdAt: row.created_at,
  }),
  families: (row) => ({
    id: row.id,
    name: row.name,
    inviteCode: row.invite_code,
    adminId: row.admin_id,
    createdAt: row.created_at,
  }),
  babies: (row) => ({
    id: row.id,
    familyId: row.family_id,
    name: row.name,
    avatar: row.avatar || null,
    gender: row.gender,
    birthDate: row.birth_date,
    createdAt: row.created_at,
  }),
  feeding_records: (row) => ({
    id: row.id,
    babyId: row.baby_id,
    familyId: row.family_id,
    memberId: row.member_id,
    memberName: row.member_name,
    amount: row.amount,
    feedingTime: row.feeding_time,
    durationMinutes: row.duration_minutes ?? null,
    note: row.note || null,
    createdAt: row.created_at,
  }),
  photos: (row) => ({
    id: row.id,
    babyId: row.baby_id,
    familyId: row.family_id,
    url: row.url,
    type: row.type,
    description: row.description || null,
    createdAt: row.created_at,
  }),
  milestones: (row) => ({
    id: row.id,
    babyId: row.baby_id,
    familyId: row.family_id,
    title: row.title,
    description: row.description || null,
    date: row.date,
    createdAt: row.created_at,
  }),
  growth_records: (row) => ({
    id: row.id,
    babyId: row.baby_id,
    familyId: row.family_id,
    height: row.height,
    weight: row.weight,
    date: row.date,
    createdAt: row.created_at,
  }),
  vaccine_reminders: (row) => ({
    id: row.id,
    babyId: row.baby_id,
    familyId: row.family_id,
    name: row.name,
    dueDate: row.due_date,
    isCompleted: Boolean(row.is_completed),
    createdAt: row.created_at,
  }),
  feeding_reminders: (row) => ({
    id: row.id,
    babyId: row.baby_id,
    familyId: row.family_id,
    suggestedTime: row.suggested_time,
    isCompleted: Boolean(row.is_completed),
    createdAt: row.created_at,
  }),
}

const migrateTable = async (tableName, mapper) => {
  const rows = sqlite.prepare(`SELECT * FROM ${tableName}`).all()
  if (!rows.length) {
    console.log(`跳过 ${tableName}（无数据）`)
    return
  }
  const collection = cloudDb.collection(tableName)
  let inserted = 0
  for (const row of rows) {
    const data = mapper(row)
    const existing = await collection.where({ id: data.id }).get()
    if (existing.data?.length) {
      continue
    }
    await collection.add({ data })
    inserted += 1
  }
  console.log(`${tableName} 迁移完成，新增 ${inserted} 条`)
}

const run = async () => {
  for (const [tableName, mapper] of Object.entries(mappers)) {
    await migrateTable(tableName, mapper)
  }
  sqlite.close()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
