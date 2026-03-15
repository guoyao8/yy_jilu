"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAppStore } from "@/store"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { calculateAge } from "@/lib/utils"
import { Plus, Edit, Trash2 } from "lucide-react"

export default function BabiesPage() {
  const router = useRouter()
  const { currentUser, babies, removeBaby, hasHydrated } = useAppStore()

  useEffect(() => {
    if (hasHydrated && !currentUser) {
      router.push("/login")
    }
  }, [currentUser, hasHydrated, router])

  if (!currentUser) return null

  const isAdmin = currentUser.role === "admin"

  const handleDelete = (id: string, name: string) => {
    if (!isAdmin) {
      alert("只有管理员可以删除宝宝")
      return
    }
    if (confirm(`确定要删除 ${name} 吗？`)) {
      removeBaby(id)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">宝宝管理</h1>
        {isAdmin && (
          <Button onClick={() => router.push("/babies/new")}>
            <Plus className="w-4 h-4 mr-2" />
            添加宝宝
          </Button>
        )}
      </div>

      {babies.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">👶</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">还没有添加宝宝</h3>
            <p className="text-gray-500 mb-6">
              {isAdmin ? "点击上方按钮添加宝宝信息" : "请等待管理员添加宝宝"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {babies.map((baby) => (
            <Card key={baby.id} className="overflow-hidden">
              <Link href={`/babies/${baby.id}`}>
                <div className="p-6 flex items-start space-x-4">
                  {baby.avatar ? (
                    <img src={baby.avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-baby-pink to-baby-purple flex items-center justify-center">
                      <span className="text-3xl">{baby.gender === "male" ? "👦" : "👧"}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{baby.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {baby.gender === "male" ? "男宝" : "女宝"} · {calculateAge(baby.birthDate)}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      出生于 {new Date(baby.birthDate).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                </div>
              </Link>
              {isAdmin && (
                <div className="border-t border-gray-100 px-6 py-3 bg-gray-50 flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      router.push(`/babies/${baby.id}/edit`)
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.preventDefault()
                      handleDelete(baby.id, baby.name)
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    删除
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
