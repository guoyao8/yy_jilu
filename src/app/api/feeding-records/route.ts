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
    const babyId = searchParams.get("babyId")

    if (!familyId) {
      return NextResponse.json({ error: "缺少 familyId" }, { status: 400 })
    }

    if (babyId) {
      const result = await db
        .collection("feedingRecords")
        .where({ familyId, babyId })
        .orderBy("feedingTime", "desc")
        .get()
      if (result.data?.length) return NextResponse.json(result.data.map(normalize))
      const all = await db.collection("feedingRecords").get()
      const found = (all.data || [])
        .map(normalize)
        .filter((r: any) => r?.familyId === familyId && r?.babyId === babyId)
        .sort((a: any, b: any) => String(b?.feedingTime || "").localeCompare(String(a?.feedingTime || "")))
      return NextResponse.json(found)
    }

    const result = await db
      .collection("feedingRecords")
      .where({ familyId })
      .orderBy("feedingTime", "desc")
      .get()
    if (result.data?.length) return NextResponse.json(result.data.map(normalize))
    const all = await db.collection("feedingRecords").get()
    const found = (all.data || [])
      .map(normalize)
      .filter((r: any) => r?.familyId === familyId)
      .sort((a: any, b: any) => String(b?.feedingTime || "").localeCompare(String(a?.feedingTime || "")))
    return NextResponse.json(found)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "查询失败" }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb()
    const body = await request.json()
    const {
      id,
      babyId,
      familyId,
      memberId,
      memberName,
      amount,
      feedingTime,
      durationMinutes,
      note,
    } = body || {}

    if (!id || !babyId || !familyId || !memberId || !memberName || typeof amount !== "number" || !feedingTime) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 })
    }

    const all = await db.collection("feedingRecords").get()
    if ((all.data || []).map(normalize).some((r: any) => r?.id === id)) {
      return NextResponse.json({ error: "记录已存在" }, { status: 400 })
    }

    await db.collection("feedingRecords").add({
      id,
      babyId,
      familyId,
      memberId,
      memberName,
      amount,
      feedingTime,
      durationMinutes: typeof durationMinutes === "number" ? durationMinutes : undefined,
      note: note || "",
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "创建失败" }, { status: 400 })
  }
}

