"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { ArrowLeft } from "lucide-react"

export default function NewFeedingPage() {
  const router = useRouter()
  const { currentUser, babies, addFeedingRecord, hasHydrated } = useAppStore()
  const [selectedBaby, setSelectedBaby] = useState("")
  const [amount, setAmount] = useState("")
  const [feedingTime, setFeedingTime] = useState(
    new Date().toISOString().slice(0, 16)
  )
  const [duration, setDuration] = useState("")
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (hasHydrated && !currentUser) {
      router.push("/login")
      return
    }
    if (babies.length > 0 && !selectedBaby) {
      setSelectedBaby(babies[0].id)
    }
  }, [currentUser, hasHydrated, babies, selectedBaby, router])

  if (!currentUser) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedBaby) {
      alert("请选择宝宝")
      return
    }
    
    const amountNum = parseInt(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("请输入有效的奶粉量")
      return
    }

    setLoading(true)

    try {
      const durationValue = duration ? parseInt(duration) : undefined
      await addFeedingRecord({
        babyId: selectedBaby,
        memberId: currentUser.id,
        memberName: currentUser.nickname || currentUser.phone.slice(-4),
        amount: amountNum,
        feedingTime: new Date(feedingTime).toISOString(),
        durationMinutes: durationValue,
        note: note.trim(),
      })

      router.push("/")
    } catch {
      alert("添加失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  const quickAmounts = [30, 60, 90, 120, 150, 180]

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold ml-2">添加喂养记录</h1>
      </div>

      {babies.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">👶</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">还没有添加宝宝</h3>
            <p className="text-gray-500 mb-6">请先添加宝宝信息</p>
            <Button onClick={() => router.push("/babies/new")}>
              添加宝宝
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">选择宝宝</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {babies.map((baby) => (
                  <button
                    key={baby.id}
                    type="button"
                    onClick={() => setSelectedBaby(baby.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedBaby === baby.id
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      {baby.avatar ? (
                        <img src={baby.avatar} alt="" className="w-12 h-12 rounded-full object-cover mb-2" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-baby-pink to-baby-purple flex items-center justify-center mb-2">
                          <span className="text-xl">{baby.gender === "male" ? "👦" : "👧"}</span>
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{baby.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">奶粉量</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {quickAmounts.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAmount(a.toString())}
                    className={`py-3 rounded-lg font-medium transition-all ${
                      amount === a.toString()
                        ? "bg-primary-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {a} ml
                  </button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="或输入其他数量"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
                max={500}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">喂养时间</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="datetime-local"
                value={feedingTime}
                onChange={(e) => setFeedingTime(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">喂养时长与备注</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <Input
                  type="number"
                  placeholder="喂养时长（分钟）"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min={1}
                />
              </div>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                rows={3}
                placeholder="记录宝宝的状态或其他信息..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={loading}
          >
            {loading ? "保存中..." : "保存记录"}
          </Button>
        </form>
      )}
    </div>
  )
}
