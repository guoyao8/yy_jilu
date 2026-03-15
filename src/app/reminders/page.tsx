"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { formatDate } from "@/lib/utils"
import { Syringe, Plus, Check, Trash2 } from "lucide-react"

export default function RemindersPage() {
  const router = useRouter()
  const { currentUser, babies, vaccineReminders, addVaccineReminder, updateVaccineReminder, removeVaccineReminder, hasHydrated } = useAppStore()
  
  const [showAddVaccine, setShowAddVaccine] = useState(false)
  const [selectedBaby, setSelectedBaby] = useState("")
  const [vaccineName, setVaccineName] = useState("")
  const [vaccineDate, setVaccineDate] = useState("")

  useEffect(() => {
    if (hasHydrated && !currentUser) {
      router.push("/login")
    }
    if (babies.length > 0 && !selectedBaby) {
      setSelectedBaby(babies[0].id)
    }
  }, [currentUser, hasHydrated, babies, selectedBaby, router])

  if (!currentUser) {
    return null
  }

  const isAdmin = currentUser.role === "admin"

  const handleAddVaccine = () => {
    if (!selectedBaby || !vaccineName.trim() || !vaccineDate) {
      alert("请填写完整信息")
      return
    }
    addVaccineReminder({
      babyId: selectedBaby,
      name: vaccineName.trim(),
      dueDate: vaccineDate,
      isCompleted: false,
    })
    setVaccineName("")
    setVaccineDate("")
    setShowAddVaccine(false)
  }

  const pendingVaccines = vaccineReminders.filter((r) => !r.isCompleted)
  const completedVaccines = vaccineReminders.filter((r) => r.isCompleted)

  const getBabyById = (id: string) => babies.find((b) => b.id === id)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">疫苗提醒</h1>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Syringe className="w-5 h-5 mr-2" />
            疫苗接种计划
          </CardTitle>
          {isAdmin && (
            <Button size="sm" onClick={() => setShowAddVaccine(true)}>
              <Plus className="w-4 h-4 mr-1" />
              添加
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {showAddVaccine && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <select
                value={selectedBaby}
                onChange={(e) => setSelectedBaby(e.target.value)}
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {babies.map((baby) => (
                  <option key={baby.id} value={baby.id}>
                    {baby.name}
                  </option>
                ))}
              </select>
              <Input
                placeholder="疫苗名称（如：乙肝疫苗第一针）"
                value={vaccineName}
                onChange={(e) => setVaccineName(e.target.value)}
              />
              <Input
                type="date"
                value={vaccineDate}
                onChange={(e) => setVaccineDate(e.target.value)}
              />
              <div className="flex space-x-2">
                <Button onClick={handleAddVaccine}>保存</Button>
                <Button variant="outline" onClick={() => setShowAddVaccine(false)}>取消</Button>
              </div>
            </div>
          )}

          {pendingVaccines.length === 0 && completedVaccines.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Syringe className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>暂无疫苗提醒</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingVaccines.map((vaccine) => {
                const baby = getBabyById(vaccine.babyId)
                const isOverdue = new Date(vaccine.dueDate) < new Date()
                
                return (
                  <div
                    key={vaccine.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      isOverdue ? "bg-red-50 border border-red-200" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isOverdue ? "bg-red-100" : "bg-blue-100"
                      }`}>
                        <Syringe className={`w-5 h-5 ${isOverdue ? "text-red-500" : "text-blue-500"}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{vaccine.name}</p>
                        <p className="text-sm text-gray-500">
                          {baby?.name} · {formatDate(vaccine.dueDate)}
                          {isOverdue && <span className="text-red-500 ml-2">已过期</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateVaccineReminder(vaccine.id, { isCompleted: true })}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        已接种
                      </Button>
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500"
                          onClick={() => removeVaccineReminder(vaccine.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}

              {completedVaccines.length > 0 && (
                <>
                  <p className="text-sm text-gray-500 mt-4 mb-2">已完成</p>
                  {completedVaccines.slice(0, 5).map((vaccine) => {
                    const baby = getBabyById(vaccine.babyId)
                    return (
                      <div
                        key={vaccine.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-100 opacity-60"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Check className="w-4 h-4 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-700 line-through">{vaccine.name}</p>
                            <p className="text-xs text-gray-500">{baby?.name}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
