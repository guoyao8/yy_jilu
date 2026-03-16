import { NextResponse } from "next/server"
import { getDb } from "@/server/cloudbase"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get("phone")
    const familyId = searchParams.get("familyId")

    if (phone) {
      const result = await db.collection("users").where({ phone }).get()
      return NextResponse.json(result.data?.[0] || null)
    }

    if (familyId) {
      const result = await db.collection("users").where({ familyId }).orderBy("createdAt", "desc").get()
      return NextResponse.json(result.data || [])
    }

    const result = await db.collection("users").orderBy("createdAt", "desc").get()
    return NextResponse.json(result.data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "查询失败" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const db = getDb()
  const body = await request.json()
  const { id, phone, password, nickname, avatar, role, familyId } = body || {}

  if (!id || !phone || !password || !nickname || !role) {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 })
  }

  try {
    const existing = await db.collection("users").where({ phone }).get()
    if (existing.data?.length) {
      return NextResponse.json({ error: "手机号已存在" }, { status: 400 })
    }
    await db.collection("users").add({
      data: {
        id,
        phone,
        password,
        nickname,
        avatar: avatar || null,
        role,
        familyId: familyId || null,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "创建失败" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
