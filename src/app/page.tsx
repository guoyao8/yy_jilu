"use client"

import { useCallback, useEffect, useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { cn, formatTime, isToday } from "@/lib/utils"
import { Plus, Clock, Mic } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const { currentUser, babies, feedingRecords, hasHydrated, addFeedingRecord } = useAppStore()
  const [selectedBaby, setSelectedBaby] = useState("")
  const [amount, setAmount] = useState("")
  const [duration, setDuration] = useState("")
  const [note, setNote] = useState("")
  const [feedingTime, setFeedingTime] = useState(new Date().toISOString().slice(0, 16))
  const [saving, setSaving] = useState(false)
  const [voiceModalOpen, setVoiceModalOpen] = useState(false)
  const [voiceText, setVoiceText] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [asrStatus, setAsrStatus] = useState("")
  const [voiceError, setVoiceError] = useState("")
  const [parsedVoice, setParsedVoice] = useState<{
    babyId?: string
    babyName?: string
    amount?: number
    durationMinutes?: number
    startTime?: Date
    endTime?: Date
  }>({})
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    if (hasHydrated && !currentUser) {
      router.push("/login")
    }
  }, [currentUser, hasHydrated, router])

  useEffect(() => {
    if (babies.length > 0 && !selectedBaby) {
      setSelectedBaby(babies[0].id)
    }
  }, [babies, selectedBaby])

  const sortedBabies = useMemo(() => {
    return [...babies].sort((a, b) => a.name.localeCompare(b.name))
  }, [babies])

  const getBabyRecords = useCallback((babyId: string) => {
    return feedingRecords
      .filter(r => r.babyId === babyId)
      .sort((a, b) => new Date(b.feedingTime).getTime() - new Date(a.feedingTime).getTime())
  }, [feedingRecords])

  const formatInterval = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (hours <= 0) return `${remainingMinutes}分钟`
    if (remainingMinutes === 0) return `${hours}小时`
    return `${hours}小时${remainingMinutes}分钟`
  }

  const getIntervalColor = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    if (minutes < 120) return "text-green-600"
    if (minutes < 240) return "text-orange-500"
    return "text-red-500"
  }

  const selectedBabyRecords = useMemo(() => {
    if (!selectedBaby) return []
    return getBabyRecords(selectedBaby)
  }, [selectedBaby, getBabyRecords])

  const lastAmount = selectedBabyRecords[0]?.amount
  const quickAmounts = useMemo(() => {
    if (!lastAmount) return [60, 90, 120]
    const candidates = [lastAmount, lastAmount - 10, lastAmount + 10, lastAmount + 20]
    return Array.from(new Set(candidates.filter((v) => v > 0))).slice(0, 4)
  }, [lastAmount])

  useEffect(() => {
    if (lastAmount) {
      setAmount(lastAmount.toString())
    }
  }, [lastAmount])

  const toDateTimeInput = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const parseChineseNumber = (text: string) => {
    const map: Record<string, number> = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }
    if (text.includes("百")) {
      const [h, t] = text.split("百")
      const hVal = map[h] ?? 0
      const rest = t || ""
      if (rest.includes("十")) {
        const [d, u] = rest.split("十")
        const dVal = d ? map[d] ?? 0 : 1
        const uVal = u ? map[u] ?? 0 : 0
        return hVal * 100 + dVal * 10 + uVal
      }
      const restVal = rest ? map[rest] ?? 0 : 0
      return hVal * 100 + restVal
    }
    if (text.includes("十")) {
      const [d, u] = text.split("十")
      const dVal = d ? map[d] ?? 0 : 1
      const uVal = u ? map[u] ?? 0 : 0
      return dVal * 10 + uVal
    }
    return map[text] ?? null
  }

  const parseSpeech = (text: string) => {
    let amountValue: number | undefined
    let durationValue: number | undefined
    let timeValue: Date | undefined
    let startTimeValue: Date | undefined
    let endTimeValue: Date | undefined
    let babyIdValue: string | undefined
    let babyNameValue: string | undefined

    const matchedBaby = babies.find((baby) => text.includes(baby.name))
    if (matchedBaby) {
      babyIdValue = matchedBaby.id
      babyNameValue = matchedBaby.name
    }

    const amountMatch = text.match(/(\d+)\s*(毫升|ml)/i)
    if (amountMatch) {
      amountValue = parseInt(amountMatch[1])
    }

    const durationMatch = text.match(/(\d+)\s*分钟/)
    if (durationMatch) {
      durationValue = parseInt(durationMatch[1])
    }

    if (!amountValue) {
      const chineseAmount = text.match(/([零一二两三四五六七八九十百]+)\s*(毫升|ml)/i)
      if (chineseAmount) {
        const v = parseChineseNumber(chineseAmount[1])
        if (v) amountValue = v
      }
    }

    if (!durationValue) {
      const chineseDuration = text.match(/([零一二两三四五六七八九十百]+)\s*分钟/)
      if (chineseDuration) {
        const v = parseChineseNumber(chineseDuration[1])
        if (v) durationValue = v
      }
    }

    const rangeMatch = text.match(/从(\d{1,2})点(半|\d{1,2})?到(\d{1,2})点(半|\d{1,2})?/i)
    if (rangeMatch) {
      const startHour = parseInt(rangeMatch[1])
      const startMinute = rangeMatch[2] === "半" ? 30 : rangeMatch[2] ? parseInt(rangeMatch[2]) : 0
      const endHour = parseInt(rangeMatch[3])
      const endMinute = rangeMatch[4] === "半" ? 30 : rangeMatch[4] ? parseInt(rangeMatch[4]) : 0
      const start = new Date()
      start.setHours(startHour, startMinute, 0, 0)
      const end = new Date()
      end.setHours(endHour, endMinute, 0, 0)
      startTimeValue = start
      endTimeValue = end
      const diff = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
      if (diff > 0) durationValue = diff
    }

    const timeMatch = text.match(/(\d{1,2})[:点](\d{1,2})?/i)
    if (timeMatch) {
      const hours = parseInt(timeMatch[1])
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0
      const d = new Date()
      d.setHours(hours, minutes, 0, 0)
      timeValue = d
    }

    if (!timeValue && text.includes("半")) {
      const halfMatch = text.match(/(\d{1,2})点半/)
      if (halfMatch) {
        const hours = parseInt(halfMatch[1])
        const d = new Date()
        d.setHours(hours, 30, 0, 0)
        timeValue = d
      }
    }

    if (!endTimeValue) {
      if (timeValue) {
        endTimeValue = timeValue
      } else if (text.includes("现在")) {
        endTimeValue = new Date()
      } else if (durationValue) {
        endTimeValue = new Date()
      }
    }

    if (!startTimeValue && durationValue && endTimeValue) {
      startTimeValue = new Date(endTimeValue.getTime() - durationValue * 60000)
    }

    return {
      babyIdValue,
      babyNameValue,
      amountValue,
      durationValue,
      startTimeValue,
      endTimeValue,
    }
  }

  const applyVoiceRecord = () => {
    if (!currentUser) return
    if (!parsedVoice.babyId || !parsedVoice.amount || !parsedVoice.endTime) {
      return
    }
    void addFeedingRecord({
      babyId: parsedVoice.babyId,
      memberId: currentUser.id,
      memberName: currentUser.nickname || currentUser.phone.slice(-4),
      amount: parsedVoice.amount,
      feedingTime: parsedVoice.endTime.toISOString(),
      durationMinutes: parsedVoice.durationMinutes,
      note: note.trim(),
    })
    setVoiceModalOpen(false)
    setVoiceText("")
    setParsedVoice({})
    setAsrStatus("")
    setVoiceError("")
  }

  const startListening = () => {
    if (recognitionRef.current) return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setAsrStatus("当前浏览器不支持语音识别")
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = "zh-CN"
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setAsrStatus("正在识别…")
    }

    recognition.onresult = (event) => {
      let fullText = ""
      for (let i = 0; i < event.results.length; i++) {
        fullText += event.results[i][0].transcript
      }
      if (fullText.trim()) {
        setVoiceText(fullText.trim())
      }
    }

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setAsrStatus("麦克风权限被拒绝")
      } else if (event.error === "no-speech") {
        setAsrStatus("未检测到语音")
      } else if (event.error === "network") {
        setAsrStatus("网络错误")
      } else {
        setAsrStatus("识别失败")
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      setAsrStatus("")
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
  }

  useEffect(() => {
    if (!voiceText.trim()) {
      setParsedVoice({})
      setVoiceError("")
      return
    }
    const parsed = parseSpeech(voiceText)
    const missing: string[] = []
    if (!parsed.babyIdValue) missing.push("宝宝昵称")
    if (!parsed.amountValue) missing.push("喂奶量")
    if (!parsed.endTimeValue) missing.push("喂奶结束时间")
    setParsedVoice({
      babyId: parsed.babyIdValue,
      babyName: parsed.babyNameValue,
      amount: parsed.amountValue,
      durationMinutes: parsed.durationValue,
      startTime: parsed.startTimeValue,
      endTime: parsed.endTimeValue,
    })
    if (missing.length > 0) {
      setVoiceError(`缺少必填字段：${missing.join("、")}`)
    } else {
      setVoiceError("")
    }
  }, [voiceText])

  const handleQuickAdd = async () => {
    if (!currentUser) return
    if (!selectedBaby) {
      alert("请选择宝宝")
      return
    }
    const amountValue = parseInt(amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      alert("请输入有效的奶粉量")
      return
    }
    const durationValue = duration ? parseInt(duration) : undefined
    const timeValue = feedingTime ? new Date(feedingTime).toISOString() : new Date().toISOString()
    setSaving(true)
    try {
      await addFeedingRecord({
        babyId: selectedBaby,
        memberId: currentUser.id,
        memberName: currentUser.nickname || currentUser.phone.slice(-4),
        amount: amountValue,
        feedingTime: timeValue,
        durationMinutes: durationValue,
        note: note.trim(),
      })
      setAmount("")
      setDuration("")
      setNote("")
      setFeedingTime(toDateTimeInput(new Date()))
    } finally {
      setSaving(false)
    }
  }


  if (!currentUser) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">今日喂养</h1>

      {babies.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">👶</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">还没有添加宝宝</h3>
            <p className="text-gray-500 mb-6">添加宝宝信息，开始记录喂养吧</p>
            <Button onClick={() => router.push("/babies/new")}>
              <Plus className="w-4 h-4 mr-2" />
              添加宝宝
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-2 mb-4">
            {sortedBabies.map((baby) => {
              const records = getBabyRecords(baby.id)
              const lastRecord = records[0]
              const todayRecords = records.filter(r => isToday(r.feedingTime))
              const todayCount = todayRecords.length
              const todayTotal = todayRecords.reduce((sum, r) => sum + r.amount, 0)
              const interval = lastRecord ? Date.now() - new Date(lastRecord.feedingTime).getTime() : null
              const isSelected = selectedBaby === baby.id
              return (
                <Card
                  key={baby.id}
                  className={cn(
                    "w-[64%] max-w-[260px] shrink-0 cursor-pointer transition-all",
                    isSelected ? "border-primary-400 shadow-md" : "border-gray-200"
                  )}
                  onClick={() => setSelectedBaby(baby.id)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <button
                        className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center"
                        onClick={(event) => {
                          event.stopPropagation()
                          router.push(`/growth?babyId=${baby.id}`)
                        }}
                      >
                        <span className="text-lg">{baby.gender === "male" ? "👦" : "👧"}</span>
                      </button>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{baby.name}</p>
                        <p className="text-xs text-gray-500">
                          {todayCount} 次 · {todayTotal} ml
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">上次</span>
                        <span className="font-medium text-gray-900">
                          {lastRecord ? `${formatTime(lastRecord.feedingTime)} · ${lastRecord.amount}ml` : "暂无"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">间隔</span>
                        <span className={cn("font-medium", interval ? getIntervalColor(interval) : "text-gray-400")}>
                          {interval ? formatInterval(interval) : "暂无"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className="mb-4">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">真好，又吃了一顿</CardTitle>
              <span className="text-sm text-gray-500">
                {sortedBabies.find(b => b.id === selectedBaby)?.name || "未选择"}
              </span>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="grid grid-cols-2 gap-2">
                {quickAmounts.map((value) => (
                  <button
                    key={value}
                    onClick={() => setAmount(value.toString())}
                    className={cn(
                      "py-3 rounded-lg font-medium",
                      amount === value.toString()
                        ? "bg-primary-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {value} ml
                  </button>
                ))}
              </div>

              <Input
                type="number"
                placeholder="奶粉量（ml）"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>喂养发生时间</span>
                  <button
                    className="text-primary-600 font-medium"
                    onClick={() => setFeedingTime(new Date().toISOString().slice(0, 16))}
                  >
                    现在
                  </button>
                </div>
                <Input
                  type="datetime-local"
                  value={feedingTime}
                  onChange={(e) => setFeedingTime(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="喂养时长（分钟）"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min={1}
                />
                <Input
                  type="text"
                  placeholder="备注（可选）"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <Button className="w-full h-12 text-base" onClick={handleQuickAdd} disabled={saving}>
                {saving ? "保存中..." : "保存记录"}
              </Button>
            </CardContent>
          </Card>

          <Card className="mb-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">今天的喂养记录</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push("/statistics")}>
                查看更多
              </Button>
            </CardHeader>
            <CardContent>
              {feedingRecords.filter(r => isToday(r.feedingTime) && r.babyId === selectedBaby).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>今天还没有喂养记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedingRecords
                    .filter(r => isToday(r.feedingTime) && r.babyId === selectedBaby)
                    .sort((a, b) => new Date(b.feedingTime).getTime() - new Date(a.feedingTime).getTime())
                    .slice(0, 6)
                    .map((record) => {
                      const baby = babies.find(b => b.id === record.babyId)
                      return (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span>{baby?.gender === "male" ? "👦" : "👧"}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{baby?.name || "未知"}</p>
                              <p className="text-sm text-gray-500">
                                {formatTime(record.feedingTime)} · {record.memberName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary-600">{record.amount} ml</p>
                            <p className="text-xs text-gray-400">
                              {record.durationMinutes ? `${record.durationMinutes} 分钟` : "时长未记录"}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <button
        onClick={() => {
          setVoiceModalOpen(true)
          setVoiceText("")
          setParsedVoice({})
          setVoiceError("")
          setAsrStatus("")
          startListening()
        }}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center transition-colors z-40 bg-primary-500 hover:bg-primary-600"
      >
        <Mic className="w-6 h-6" />
      </button>

      {voiceModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">语音识别</h3>
              <button
                onClick={() => {
                  stopListening()
                  setVoiceModalOpen(false)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                关闭
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500 mb-1">实时识别</p>
                <p className="text-sm text-gray-700">{voiceText || "点击后开始识别，请说话"}</p>
              </div>

              <textarea
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                placeholder="可手动补充或修改识别内容"
                className="w-full min-h-[100px] rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
              />

              {asrStatus && (
                <p className="text-xs text-gray-400">{asrStatus}</p>
              )}

              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-xs text-gray-500 mb-2">识别字段</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">宝宝昵称</span>
                    <span className="text-gray-900">{parsedVoice.babyName || "未识别"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">喂奶量</span>
                    <span className="text-gray-900">{parsedVoice.amount ? `${parsedVoice.amount} ml` : "未识别"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">开始时间</span>
                    <span className="text-gray-900">{parsedVoice.startTime ? formatTime(parsedVoice.startTime.toISOString()) : "未识别"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">结束时间</span>
                    <span className="text-gray-900">{parsedVoice.endTime ? formatTime(parsedVoice.endTime.toISOString()) : "未识别"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">时长</span>
                    <span className="text-gray-900">{parsedVoice.durationMinutes ? `${parsedVoice.durationMinutes} 分钟` : "未识别"}</span>
                  </div>
                </div>
              </div>

              {voiceError && (
                <p className="text-xs text-red-500">{voiceError}</p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    stopListening()
                    setVoiceModalOpen(false)
                  }}
                >
                  取消
                </Button>
                <Button
                  className="flex-1"
                  onClick={applyVoiceRecord}
                  disabled={!!voiceError || !parsedVoice.babyId || !parsedVoice.amount || !parsedVoice.endTime}
                >
                  生成喂养记录
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
