"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAppStore } from "@/store"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Settings, User, LogOut, Users, Bell, Baby } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const { currentUser, updateUser, logout, hasHydrated } = useAppStore()
  const [nickname, setNickname] = useState("")
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
    setNickname(currentUser.nickname || "")
    setAvatar(currentUser.avatar || "")
  }, [currentUser, hasHydrated, router])

  if (!currentUser) {
    return null
  }

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

  const handleSave = async () => {
    setLoading(true)
    try {
      updateUser({
        nickname: nickname.trim() || currentUser.phone.slice(-4),
        avatar: avatar || null,
      })
      alert("保存成功")
    } catch {
      alert("保存失败")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (confirm("确定要退出登录吗？")) {
      logout()
      router.push("/login")
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">我的</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">快捷入口</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Link href="/babies">
            <Button variant="outline" className="w-full justify-start">
              <Baby className="w-4 h-4 mr-2" />
              宝宝管理
            </Button>
          </Link>
          <Link href="/family">
            <Button variant="outline" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              家庭成员
            </Button>
          </Link>
          <Link href="/reminders">
            <Button variant="outline" className="w-full justify-start">
              <Bell className="w-4 h-4 mr-2" />
              疫苗提醒
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <User className="w-5 h-5 mr-2" />
            个人信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">头像</label>
            <div className="flex items-center space-x-4">
              {avatar ? (
                <img src={avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-xl">
                    {nickname?.[0] || currentUser.phone.slice(-2)}
                  </span>
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
                    更换头像
                  </Button>
                </label>
              </div>
            </div>
          </div>

          <Input
            label="昵称"
            type="text"
            placeholder="家人怎么称呼你？"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <p className="text-gray-500">{currentUser.phone}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
            <p className="text-gray-500">
              {currentUser.role === "admin" ? "管理员" : "普通成员"}
            </p>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "保存中..." : "保存修改"}
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            其他设置
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-gray-400 text-sm">
        宝宝喂养记 v0.1.0
      </p>
    </div>
  )
}
