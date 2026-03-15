import { NextResponse } from "next/server"
import { getDb } from "@/server/cloudbase"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const db = getDb()
  const { searchParams } = new URL(request.url)
  const inviteCode = searchParams.get("inviteCode")
  const id = searchParams.get("id")

  if (id) {
    const result = await db.collection("families").where({ id }).get()
    return NextResponse.json(result.data?.[0] || null)
  }

  if (inviteCode) {
    const result = await db.collection("families").where({ inviteCode }).get()
    return NextResponse.json(result.data?.[0] || null)
  }

  const result = await db.collection("families").orderBy("createdAt", "desc").get()
  return NextResponse.json(result.data || [])
}

export async function POST(request: Request) {
  const db = getDb()
  const body = await request.json()
  const { id, name, inviteCode, adminId } = body || {}

  if (!id || !name || !inviteCode || !adminId) {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 })
  }

  try {
    const existing = await db.collection("families").where({ inviteCode }).get()
    if (existing.data?.length) {
      return NextResponse.json({ error: "邀请码已存在" }, { status: 400 })
    }
    await db.collection("families").add({
      data: {
        id,
        name,
        inviteCode,
        adminId,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "创建失败" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
