"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { ArrowLeft } from "lucide-react"

export default function NewBabyPage() {
  const router = useRouter()
  const { currentUser, addBaby, hasHydrated } = useAppStore()
  const [name, setName] = useState("")
  const [gender, setGender] = useState<"male" | "female">("male")
  const [birthDate, setBirthDate] = useState("")
  const [avatar, setAvatar] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (hasHydrated && !currentUser) {
      router.push("/login")
      return
    }
    if (!currentUser) {
      return
    }
    if (currentUser.role !== "admin") {
      alert("只有管理员可以添加宝宝")
      router.push("/babies")
    }
  }, [currentUser, hasHydrated, router])

  if (!currentUser || currentUser.role !== "admin") return null

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      alert("请输入宝宝昵称")
      return
    }
    if (!birthDate) {
      alert("请选择出生日期")
      return
    }

    setLoading(true)

    try {
      addBaby({
        name: name.trim(),
        gender,
        birthDate,
        avatar: avatar || null,
      })

      router.push("/babies")
    } catch {
      alert("添加失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold ml-2">添加宝宝</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">宝宝头像</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              {avatar ? (
                <img src={avatar} alt="" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-baby-pink to-baby-purple flex items-center justify-center">
                  <span className="text-3xl">{gender === "male" ? "👦" : "👧"}</span>
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-input"
                />
                <label htmlFor="avatar-input">
                  <Button type="button" variant="outline">
                    上传头像
                  </Button>
                </label>
                <p className="text-xs text-gray-400 mt-2">支持 JPG、PNG 格式</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="宝宝昵称"
              type="text"
              placeholder="请输入宝宝小名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">性别</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    gender === "male"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-3xl mb-1">👦</span>
                    <span className="font-medium text-gray-900">男宝</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    gender === "female"
                      ? "border-pink-500 bg-pink-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-3xl mb-1">👧</span>
                    <span className="font-medium text-gray-900">女宝</span>
                  </div>
                </button>
              </div>
            </div>

            <Input
              label="出生日期"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full h-12 text-lg"
          disabled={loading}
        >
          {loading ? "保存中..." : "添加宝宝"}
        </Button>
      </form>
    </div>
  )
}
