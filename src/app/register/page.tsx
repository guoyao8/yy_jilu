"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAppStore } from "@/store"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { generateId, generateInviteCode } from "@/lib/utils"

export default function RegisterPage() {
  const router = useRouter()
  const { setCurrentUser, setFamily, setMembers } = useAppStore()
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [nickname, setNickname] = useState("")
  const [familyName, setFamilyName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose")

  const fetchJson = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new Error(data?.error || "请求失败")
    }
    return res.json()
  }

  const validatePhone = (phone: string) => {
    return /^1[3-9]\d{9}$/.test(phone)
  }

  const handleCreateFamily = async () => {
    if (!validatePhone(phone)) {
      setError("请输入正确的手机号")
      return
    }
    if (password.length < 6) {
      setError("密码至少6位")
      return
    }
    if (password !== confirmPassword) {
      setError("两次密码不一致")
      return
    }
    if (!familyName.trim()) {
      setError("请输入家庭名称")
      return
    }

    setLoading(true)
    setError("")

    try {
      const existingUser = await fetchJson(`/api/users?phone=${encodeURIComponent(phone)}`)
      if (existingUser) {
        setError("该手机号已注册")
        setLoading(false)
        return
      }

      const family = {
        id: generateId(),
        name: familyName.trim(),
        inviteCode: generateInviteCode(),
        adminId: "",
        createdAt: new Date().toISOString(),
      }

      const newUser = {
        id: generateId(),
        phone,
        password,
        nickname: nickname.trim() || phone.slice(-4),
        avatar: null,
        role: "admin" as const,
        familyId: family.id,
        createdAt: new Date().toISOString(),
      }

      family.adminId = newUser.id

      await fetchJson("/api/families", {
        method: "POST",
        body: JSON.stringify(family),
      })
      await fetchJson("/api/users", {
        method: "POST",
        body: JSON.stringify(newUser),
      })

      setCurrentUser(newUser)
      setFamily(family)
      setMembers([newUser])

      router.push("/")
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : "注册失败，请重试"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinFamily = async () => {
    if (!validatePhone(phone)) {
      setError("请输入正确的手机号")
      return
    }
    if (password.length < 6) {
      setError("密码至少6位")
      return
    }
    if (password !== confirmPassword) {
      setError("两次密码不一致")
      return
    }
    if (!inviteCode.trim()) {
      setError("请输入邀请码")
      return
    }

    setLoading(true)
    setError("")

    try {
      const existingUser = await fetchJson(`/api/users?phone=${encodeURIComponent(phone)}`)
      if (existingUser) {
        setError("该手机号已注册")
        setLoading(false)
        return
      }

      const family = await fetchJson(
        `/api/families?inviteCode=${encodeURIComponent(inviteCode.trim().toUpperCase())}`
      )

      if (!family) {
        setError("邀请码无效")
        setLoading(false)
        return
      }

      const newUser = {
        id: generateId(),
        phone,
        password,
        nickname: nickname.trim() || phone.slice(-4),
        avatar: null,
        role: "member" as const,
        familyId: family.id,
        createdAt: new Date().toISOString(),
      }

      await fetchJson("/api/users", {
        method: "POST",
        body: JSON.stringify(newUser),
      })

      setCurrentUser(newUser)
      setFamily(family)

      const familyMembers = await fetchJson(
        `/api/users?familyId=${encodeURIComponent(family.id)}`
      )
      setMembers(familyMembers || [])

      router.push("/")
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : "注册失败，请重试"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-baby-pink/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-5xl mb-4">🍼</div>
          <CardTitle className="text-2xl">注册账号</CardTitle>
        </CardHeader>
        <CardContent>
          {mode === "choose" && (
            <div className="space-y-4">
              <p className="text-center text-gray-500 mb-6">选择你的身份</p>
              <Button
                className="w-full h-20 text-lg"
                onClick={() => setMode("create")}
              >
                👨‍👩‍👧 创建新家庭
              </Button>
              <Button
                variant="outline"
                className="w-full h-20 text-lg"
                onClick={() => setMode("join")}
              >
                👋 加入已有家庭
              </Button>
              <div className="mt-6 text-center">
                <p className="text-gray-500">
                  已有账号？{" "}
                  <Link href="/login" className="text-primary-600 hover:underline font-medium">
                    立即登录
                  </Link>
                </p>
              </div>
            </div>
          )}

          {mode === "create" && (
            <form onSubmit={(e) => { e.preventDefault(); handleCreateFamily(); }} className="space-y-4">
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
                placeholder="请输入密码（至少6位）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                label="确认密码"
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Input
                label="昵称（可选）"
                type="text"
                placeholder="家人怎么称呼你？"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              <Input
                label="家庭名称"
                type="text"
                placeholder="例如：幸福之家"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                required
              />
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setMode("choose")}
                >
                  返回
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? "注册中..." : "创建家庭"}
                </Button>
              </div>
            </form>
          )}

          {mode === "join" && (
            <form onSubmit={(e) => { e.preventDefault(); handleJoinFamily(); }} className="space-y-4">
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
                placeholder="请输入密码（至少6位）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                label="确认密码"
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Input
                label="昵称（可选）"
                type="text"
                placeholder="家人怎么称呼你？"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              <Input
                label="邀请码"
                type="text"
                placeholder="请输入6位邀请码"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={6}
                required
              />
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setMode("choose")}
                >
                  返回
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? "注册中..." : "加入家庭"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
