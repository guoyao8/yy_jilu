"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAppStore } from "@/store"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { generateId } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const { setCurrentUser, setFamily, setMembers, addMember } = useAppStore()
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const storedUsers = localStorage.getItem("baby-feeding-users")
      const users = storedUsers ? JSON.parse(storedUsers) : []
      
      const user = users.find((u: { phone: string; password: string }) => 
        u.phone === phone && u.password === password
      )

      if (!user) {
        setError("手机号或密码错误")
        setLoading(false)
        return
      }

      setCurrentUser(user)

      const storedFamilies = localStorage.getItem("baby-feeding-families")
      const families = storedFamilies ? JSON.parse(storedFamilies) : []
      const userFamily = families.find((f: { id: string }) => f.id === user.familyId)
      
      if (userFamily) {
        setFamily(userFamily)
        
        const familyMembers = users.filter((u: { familyId: string }) => u.familyId === userFamily.id)
        setMembers(familyMembers)
      }

      router.push("/")
    } catch {
      setError("登录失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-baby-pink/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-5xl mb-4">🍼</div>
          <CardTitle className="text-2xl">宝宝喂养记</CardTitle>
          <p className="text-gray-500 mt-2">记录宝宝成长的每一天</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="手机号"
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Input
              label="密码"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "登录中..." : "登录"}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-500">
              还没有账号？{" "}
              <Link href="/register" className="text-primary-600 hover:underline font-medium">
                立即注册
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
