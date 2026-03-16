import { NextResponse } from "next/server"
import { getDb } from "@/server/cloudbase"

export const runtime = "nodejs"

const normalizeUser = (doc: any) => {
  if (doc && typeof doc === "object" && doc.data && typeof doc.data === "object") {
    return { ...doc.data, _id: doc._id }
  }
  return doc
}

export async function GET(request: Request) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get("phone")
    const familyId = searchParams.get("familyId")

    if (phone) {
      const result = await db.collection("users").where({ phone }).get()
      if (result.data?.[0]) return NextResponse.json(normalizeUser(result.data[0]))
      const all = await db.collection("users").get()
      const found = (all.data || []).map(normalizeUser).find((u: any) => u?.phone === phone)
      return NextResponse.json(found || null)
    }

    if (familyId) {
      const result = await db.collection("users").where({ familyId }).orderBy("createdAt", "desc").get()
      if (result.data?.length) return NextResponse.json(result.data.map(normalizeUser))
      const all = await db.collection("users").get()
      const found = (all.data || []).map(normalizeUser).filter((u: any) => u?.familyId === familyId)
      return NextResponse.json(found)
    }

    const result = await db.collection("users").orderBy("createdAt", "desc").get()
    return NextResponse.json((result.data || []).map(normalizeUser))
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "查询失败" }, { status: 400 })
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
    const all = await db.collection("users").get()
    if ((all.data || []).map(normalizeUser).some((u: any) => u?.phone === phone)) {
      return NextResponse.json({ error: "手机号已存在" }, { status: 400 })
    }
    await db.collection("users").add({
      id,
      phone,
      password,
      nickname,
      avatar: avatar || null,
      role,
      familyId: familyId || null,
      createdAt: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "创建失败" }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
