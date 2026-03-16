import { NextResponse } from "next/server"
import { getDb } from "@/server/cloudbase"

export const runtime = "nodejs"

const normalize = (doc: any) => {
  if (doc && typeof doc === "object" && doc.data && typeof doc.data === "object") {
    return { ...doc.data, _id: doc._id }
  }
  return doc
}

export async function GET(request: Request) {
  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const familyId = searchParams.get("familyId")
    const id = searchParams.get("id")

    if (id) {
      const result = await db.collection("babies").where({ id }).get()
      if (result.data?.[0]) return NextResponse.json(normalize(result.data[0]))
      const all = await db.collection("babies").get()
      const found = (all.data || []).map(normalize).find((b: any) => b?.id === id)
      return NextResponse.json(found || null)
    }

    if (!familyId) {
      return NextResponse.json({ error: "缺少 familyId" }, { status: 400 })
    }

    const result = await db.collection("babies").where({ familyId }).orderBy("createdAt", "desc").get()
    if (result.data?.length) return NextResponse.json(result.data.map(normalize))
    const all = await db.collection("babies").get()
    const found = (all.data || []).map(normalize).filter((b: any) => b?.familyId === familyId)
    return NextResponse.json(found)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb()
    const body = await request.json()
    const { id, familyId, name, avatar, gender, birthDate } = body || {}

    if (!id || !familyId || !name || !gender || !birthDate) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 })
    }

    const all = await db.collection("babies").get()
    if ((all.data || []).map(normalize).some((b: any) => b?.id === id)) {
      return NextResponse.json({ error: "宝宝已存在" }, { status: 400 })
    }

    await db.collection("babies").add({
      id,
      familyId,
      name,
      avatar: avatar || null,
      gender,
      birthDate,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "创建失败" }, { status: 400 })
  }
}
