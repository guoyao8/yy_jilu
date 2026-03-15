import { NextResponse } from "next/server"
import db from "@/server/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get("phone")

  if (phone) {
    const stmt = db.prepare("SELECT id, phone, nickname, avatar, role, family_id as familyId, created_at as createdAt FROM users WHERE phone = ?")
    const user = stmt.get(phone)
    return NextResponse.json(user || null)
  }

  const stmt = db.prepare("SELECT id, phone, nickname, avatar, role, family_id as familyId, created_at as createdAt FROM users ORDER BY created_at DESC")
  const users = stmt.all()
  return NextResponse.json(users)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { id, phone, password, nickname, avatar, role, familyId } = body || {}

  if (!id || !phone || !password || !nickname || !role) {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 })
  }

  const stmt = db.prepare(
    "INSERT INTO users (id, phone, password, nickname, avatar, role, family_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  )
  try {
    stmt.run(id, phone, password, nickname, avatar || null, role, familyId || null, new Date().toISOString())
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "创建失败" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
