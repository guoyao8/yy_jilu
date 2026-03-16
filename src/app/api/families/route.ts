import { NextResponse } from "next/server"
import { getDb } from "@/server/cloudbase"

export const runtime = "nodejs"

const normalizeFamily = (doc: any) => {
  if (doc && typeof doc === "object" && doc.data && typeof doc.data === "object") {
    return { ...doc.data, _id: doc._id }
  }
  return doc
}

export async function GET(request: Request) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const inviteCode = searchParams.get("inviteCode")
    const id = searchParams.get("id")

    if (id) {
      const result = await db.collection("families").where({ id }).get()
      if (result.data?.[0]) return NextResponse.json(normalizeFamily(result.data[0]))
      const all = await db.collection("families").get()
      const found = (all.data || []).map(normalizeFamily).find((f: any) => f?.id === id)
      return NextResponse.json(found || null)
    }

    if (inviteCode) {
      const result = await db.collection("families").where({ inviteCode }).get()
      if (result.data?.[0]) return NextResponse.json(normalizeFamily(result.data[0]))
      const all = await db.collection("families").get()
      const found = (all.data || [])
        .map(normalizeFamily)
        .find((f: any) => f?.inviteCode === inviteCode)
      return NextResponse.json(found || null)
    }

    const result = await db.collection("families").orderBy("createdAt", "desc").get()
    return NextResponse.json((result.data || []).map(normalizeFamily))
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "查询失败" }, { status: 400 })
  }
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
    const all = await db.collection("families").get()
    if ((all.data || []).map(normalizeFamily).some((f: any) => f?.inviteCode === inviteCode)) {
      return NextResponse.json({ error: "邀请码已存在" }, { status: 400 })
    }
    await db.collection("families").add({
      id,
      name,
      inviteCode,
      adminId,
      createdAt: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "创建失败" }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
