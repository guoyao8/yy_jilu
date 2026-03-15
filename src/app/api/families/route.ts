import { NextResponse } from "next/server"
import db from "@/server/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const inviteCode = searchParams.get("inviteCode")

  if (inviteCode) {
    const stmt = db.prepare("SELECT id, name, invite_code as inviteCode, admin_id as adminId, created_at as createdAt FROM families WHERE invite_code = ?")
    const family = stmt.get(inviteCode)
    return NextResponse.json(family || null)
  }

  const stmt = db.prepare("SELECT id, name, invite_code as inviteCode, admin_id as adminId, created_at as createdAt FROM families ORDER BY created_at DESC")
  const families = stmt.all()
  return NextResponse.json(families)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { id, name, inviteCode, adminId } = body || {}

  if (!id || !name || !inviteCode || !adminId) {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 })
  }

  const stmt = db.prepare(
    "INSERT INTO families (id, name, invite_code, admin_id, created_at) VALUES (?, ?, ?, ?, ?)"
  )
  try {
    stmt.run(id, name, inviteCode, adminId, new Date().toISOString())
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "创建失败" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
