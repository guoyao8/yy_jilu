"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { generateId, generateInviteCode } from "@/lib/utils"
import { Users, UserPlus, QrCode, Trash2, Edit, Crown, Shield } from "lucide-react"

export default function FamilyPage() {
  const router = useRouter()
  const { currentUser, family, members, updateMember, removeMember, setFamily, setMembers, hasHydrated } = useAppStore()
  const [showInvite, setShowInvite] = useState(false)
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [editNickname, setEditNickname] = useState("")
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferToId, setTransferToId] = useState("")

  useEffect(() => {
    if (hasHydrated && !currentUser) {
      router.push("/login")
    }
  }, [currentUser, hasHydrated, router])

  if (!currentUser || !family) {
    return null
  }

  const isAdmin = currentUser.role === "admin"

  const handleEditMember = (memberId: string, nickname: string) => {
    setEditingMember(memberId)
    setEditNickname(nickname)
  }

  const handleSaveEdit = () => {
    if (!editingMember || !editNickname.trim()) return
    updateMember(editingMember, { nickname: editNickname.trim() })
    setEditingMember(null)
    setEditNickname("")
  }

  const handleRemoveMember = (memberId: string, nickname: string) => {
    if (confirm(`确定要移除 ${nickname} 吗？`)) {
      removeMember(memberId)
    }
  }

  const handleTransferAdmin = () => {
    if (!transferToId) return
    if (confirm("确定要转让管理员身份吗？转让后你将变为普通成员。")) {
      updateMember(currentUser.id, { role: "member" })
      updateMember(transferToId, { role: "admin" })
      setFamily({ ...family, adminId: transferToId })
      setShowTransfer(false)
      setTransferToId("")
    }
  }

  const getInviteLink = () => {
    return `${window.location.origin}/register?code=${family.inviteCode}`
  }

  const copyInviteCode = () => {
    navigator.clipboard.writeText(family.inviteCode)
    alert("邀请码已复制")
  }

  const copyInviteLink = () => {
    navigator.clipboard.writeText(getInviteLink())
    alert("邀请链接已复制")
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">家庭成员</h1>
        {isAdmin && (
          <Button onClick={() => setShowInvite(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            邀请成员
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{family.name}</h2>
              <p className="text-gray-500 text-sm">共 {members.length} 位成员</p>
            </div>
            {isAdmin && (
              <div className="text-right">
                <p className="text-sm text-gray-500">邀请码</p>
                <p className="text-2xl font-bold text-primary-600 font-mono">{family.inviteCode}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showInvite && (
        <Card className="mb-6 border-primary-200 bg-primary-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              邀请新成员
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">邀请码</p>
              <div className="flex items-center space-x-2">
                <span className="text-3xl font-bold font-mono text-primary-600">{family.inviteCode}</span>
                <Button variant="outline" size="sm" onClick={copyInviteCode}>复制</Button>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">邀请链接</p>
              <div className="flex items-center space-x-2">
                <Input value={getInviteLink()} readOnly className="text-sm" />
                <Button variant="outline" size="sm" onClick={copyInviteLink}>复制</Button>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              将邀请码或链接发送给家人，他们注册时输入即可加入家庭
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {members.map((member) => {
          const isCurrentUser = member.id === currentUser.id
          const isEditing = editingMember === member.id
          
          return (
            <Card key={member.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {member.avatar ? (
                      <img src={member.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                        <span className="text-primary-600 font-medium text-lg">
                          {member.nickname?.[0] || member.phone.slice(-2)}
                        </span>
                      </div>
                    )}
                    <div>
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editNickname}
                            onChange={(e) => setEditNickname(e.target.value)}
                            className="w-40"
                          />
                          <Button size="sm" onClick={handleSaveEdit}>保存</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingMember(null)}>取消</Button>
                        </div>
                      ) : (
                        <p className="font-medium text-gray-900">
                          {member.nickname || member.phone.slice(-4)}
                          {isCurrentUser && <span className="text-gray-400 text-sm ml-2">(我)</span>}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">{member.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {member.role === "admin" && (
                      <span className="flex items-center px-2 py-1 bg-primary-100 text-primary-600 text-xs rounded-full">
                        <Crown className="w-3 h-3 mr-1" />
                        管理员
                      </span>
                    )}
                    {isAdmin && !isCurrentUser && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMember(member.id, member.nickname || "")}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleRemoveMember(member.id, member.nickname || member.phone.slice(-4))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {isAdmin && members.length > 1 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              转让管理员
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showTransfer ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">选择新的管理员：</p>
                <div className="space-y-2">
                  {members.filter(m => m.id !== currentUser.id).map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setTransferToId(member.id)}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        transferToId === member.id
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-medium">{member.nickname || member.phone.slice(-4)}</p>
                      <p className="text-sm text-gray-500">{member.phone}</p>
                    </button>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleTransferAdmin} disabled={!transferToId}>确认转让</Button>
                  <Button variant="outline" onClick={() => { setShowTransfer(false); setTransferToId("") }}>取消</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setShowTransfer(true)}>
                转让管理员身份
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
