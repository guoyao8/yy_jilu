"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { formatTime } from "@/lib/utils"
import { ChevronDown, Clock } from "lucide-react"

export default function StatisticsPage() {
  const router = useRouter()
  const { currentUser, babies, feedingRecords, hasHydrated } = useAppStore()
  const [activeBabyId, setActiveBabyId] = useState<string>("all")
  const [historyActiveBabyIdByDate, setHistoryActiveBabyIdByDate] = useState<Record<string, string>>({})

  useEffect(() => {
    if (hasHydrated && !currentUser) {
      router.push("/login")
    }
  }, [currentUser, hasHydrated, router])

  const todayKey = new Date().toISOString().split("T")[0]
  const recordsByDate = useMemo(() => {
    const map: Record<string, typeof feedingRecords> = {}
    feedingRecords.forEach((r) => {
      const key = r.feedingTime.split("T")[0]
      if (!map[key]) map[key] = []
      map[key].push(r)
    })
    return Object.keys(map)
      .sort((a, b) => b.localeCompare(a))
      .map((date) => {
        const records = map[date].sort((a, b) => new Date(b.feedingTime).getTime() - new Date(a.feedingTime).getTime())
        const total = records.reduce((sum, r) => sum + r.amount, 0)
        return { date, records, total, count: records.length }
      })
  }, [feedingRecords])

  const todayGroup = recordsByDate.find((group) => group.date === todayKey)
  const todayRecords = todayGroup?.records || []
  const historyGroups = recordsByDate.filter((group) => group.date !== todayKey)

  const formatMonthDay = (date: string) => {
    const [, month, day] = date.split("-")
    const mm = String(Number(month || "0"))
    const dd = String(Number(day || "0"))
    return `${mm}月${dd}日`
  }

  const babyColorClasses = [
    { dot: "bg-sky-500", text: "text-sky-700" },
    { dot: "bg-indigo-500", text: "text-indigo-700" },
    { dot: "bg-emerald-500", text: "text-emerald-700" },
    { dot: "bg-teal-500", text: "text-teal-700" },
    { dot: "bg-violet-500", text: "text-violet-700" },
  ]

  const getByBabySummary = (records: typeof feedingRecords) => {
    return babies.map((baby) => {
      const babyRecords = records.filter((r) => r.babyId === baby.id)
      return {
        babyId: baby.id,
        name: baby.name,
        total: babyRecords.reduce((sum, r) => sum + r.amount, 0),
        count: babyRecords.length,
      }
    })
  }

  const todayByBaby = useMemo(() => getByBabySummary(todayRecords), [babies, todayRecords])

  useEffect(() => {
    if (babies.length === 1) {
      setActiveBabyId(babies[0]?.id || "all")
    }
  }, [babies])

  const visibleTodayRecords = useMemo(() => {
    if (activeBabyId === "all") return todayRecords
    return todayRecords.filter((record) => record.babyId === activeBabyId)
  }, [activeBabyId, todayRecords])

  if (!currentUser) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">记录</h1>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-900">今日概览</p>
            </div>
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span>🍼</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {todayByBaby.map((item) => (
              <div key={item.babyId} className="rounded-lg bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">{item.count} 次 · {item.total} ml</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            今日明细
          </CardTitle>
        </CardHeader>
        <CardContent>
          {babies.length > 1 && (
            <div className="flex gap-2 mb-3">
              <button
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  activeBabyId === "all"
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
                onClick={() => setActiveBabyId("all")}
              >
                全部
              </button>
              {babies.map((baby) => (
                <button
                  key={baby.id}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    activeBabyId === baby.id
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                  onClick={() => setActiveBabyId(baby.id)}
                >
                  {baby.name}
                </button>
              ))}
            </div>
          )}
          {visibleTodayRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>今天还没有记录</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-3 text-xs text-gray-500 px-2">
                <span>时间</span>
                <span>宝宝</span>
                <span className="text-right">喂养量</span>
              </div>
              {visibleTodayRecords.map((record) => {
                const baby = babies.find((b) => b.id === record.babyId)
                return (
                  <div key={record.id} className="grid grid-cols-3 items-center bg-gray-50 rounded-lg px-2 py-3 text-sm">
                    <span className="text-gray-900">{formatTime(record.feedingTime)}</span>
                    <span className="text-gray-700">{baby?.name || "未知"}</span>
                    <span className="text-right font-medium text-primary-600">{record.amount} ml</span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-2">
        {historyGroups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>暂无历史记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyGroups.map((group) => {
              const summaryItems = getByBabySummary(group.records).filter((item) => item.count > 0)
              const historyActive = historyActiveBabyIdByDate[group.date] || "all"
              const visibleHistoryRecords = historyActive === "all"
                ? group.records
                : group.records.filter((r) => r.babyId === historyActive)
              return (
              <details key={group.date} className="rounded-lg border border-gray-200">
                <summary className="px-3 py-3 cursor-pointer rounded-lg transition-colors hover:bg-gray-50 list-none [&::-webkit-details-marker]:hidden">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{formatMonthDay(group.date)}</span>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      {summaryItems.length === 0 ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        summaryItems.map((item) => {
                          const babyIndex = Math.max(0, babies.findIndex((b) => b.id === item.babyId))
                          const color = babyColorClasses[babyIndex % babyColorClasses.length]
                          return (
                            <span key={item.babyId} className={`inline-flex items-center gap-1 ${color.text}`}>
                              <span className={`h-2 w-2 rounded-full ${color.dot}`} />
                              <span className="font-medium text-gray-900">{item.name}</span>
                              <span className="text-[11px]">{item.count}次 · {item.total}ml</span>
                            </span>
                          )
                        })
                      )}
                    </div>
                    <ChevronDown className="ml-auto h-4 w-4 text-gray-400" />
                  </div>
                </summary>
                <div className="px-3 pb-3">
                  {summaryItems.length > 1 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                          historyActive === "all"
                            ? "bg-primary-500 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                        onClick={() => setHistoryActiveBabyIdByDate((prev) => ({ ...prev, [group.date]: "all" }))}
                      >
                        全部
                      </button>
                      {summaryItems.map((item) => {
                        const babyIndex = Math.max(0, babies.findIndex((b) => b.id === item.babyId))
                        const color = babyColorClasses[babyIndex % babyColorClasses.length]
                        return (
                          <button
                            key={item.babyId}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${
                              historyActive === item.babyId
                                ? "bg-primary-500 text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                            onClick={() => setHistoryActiveBabyIdByDate((prev) => ({ ...prev, [group.date]: item.babyId }))}
                          >
                            <span className={`h-2 w-2 rounded-full ${color.dot}`} />
                            {item.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  <div className="mt-3 space-y-2">
                    <div className="grid grid-cols-3 text-xs text-gray-500 px-2">
                      <span>时间</span>
                      <span>宝宝</span>
                      <span className="text-right">喂养量</span>
                    </div>
                    {visibleHistoryRecords.map((record) => {
                      const baby = babies.find((b) => b.id === record.babyId)
                      return (
                        <div key={record.id} className="grid grid-cols-3 items-center bg-gray-50 rounded-lg px-2 py-3 text-sm">
                          <span className="text-gray-900">{formatTime(record.feedingTime)}</span>
                          <span className="text-gray-700">{baby?.name || "未知"}</span>
                          <span className="text-right font-medium text-primary-600">{record.amount} ml</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </details>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
