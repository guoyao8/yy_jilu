"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useAppStore } from "@/store"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { calculateAge, formatTime, formatDate } from "@/lib/utils"
import { ArrowLeft, Camera, Video, TrendingUp, Star, Plus, Clock } from "lucide-react"

export default function BabyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const babyId = params.id as string
  
  const { currentUser, babies, photos, milestones, growthRecords, addPhoto, addMilestone, addGrowthRecord, hasHydrated } = useAppStore()
  
  const [showAddPhoto, setShowAddPhoto] = useState(false)
  const [showAddMilestone, setShowAddMilestone] = useState(false)
  const [showAddGrowth, setShowAddGrowth] = useState(false)
  
  const [photoType, setPhotoType] = useState<"photo" | "video">("photo")
  const [photoUrl, setPhotoUrl] = useState("")
  const [photoFileData, setPhotoFileData] = useState("")
  const [photoDesc, setPhotoDesc] = useState("")
  
  const [milestoneTitle, setMilestoneTitle] = useState("")
  const [milestoneDesc, setMilestoneDesc] = useState("")
  const [milestoneDate, setMilestoneDate] = useState("")
  
  const [growthHeight, setGrowthHeight] = useState("")
  const [growthWeight, setGrowthWeight] = useState("")
  const [growthDate, setGrowthDate] = useState(new Date().toISOString().split("T")[0])
  const [diaryTab, setDiaryTab] = useState<"all" | "photo" | "video" | "milestone" | "growth">("all")

  const baby = babies.find(b => b.id === babyId)
  const babyPhotos = photos.filter(p => p.babyId === babyId).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const babyMilestones = milestones.filter(m => m.babyId === babyId).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const babyGrowthRecords = growthRecords.filter(g => g.babyId === babyId).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  useEffect(() => {
    if (hasHydrated && !currentUser) {
      router.push("/login")
    }
  }, [currentUser, hasHydrated, router])

  const handleAddPhoto = () => {
    const finalUrl = photoFileData || photoUrl.trim()
    if (!finalUrl) {
      alert("请上传文件或填写链接")
      return
    }
    addPhoto({
      babyId,
      url: finalUrl,
      type: photoType,
      description: photoDesc.trim(),
    })
    setPhotoUrl("")
    setPhotoFileData("")
    setPhotoDesc("")
    setShowAddPhoto(false)
  }

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoFileData(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAddMilestone = () => {
    if (!milestoneTitle.trim()) {
      alert("请输入里程碑标题")
      return
    }
    if (!milestoneDate) {
      alert("请选择日期")
      return
    }
    addMilestone({
      babyId,
      title: milestoneTitle.trim(),
      description: milestoneDesc.trim(),
      date: milestoneDate,
    })
    setMilestoneTitle("")
    setMilestoneDesc("")
    setMilestoneDate("")
    setShowAddMilestone(false)
  }

  const handleAddGrowth = () => {
    const height = parseFloat(growthHeight)
    const weight = parseFloat(growthWeight)
    if (isNaN(height) || height <= 0) {
      alert("请输入有效的身高")
      return
    }
    if (isNaN(weight) || weight <= 0) {
      alert("请输入有效的体重")
      return
    }
    addGrowthRecord({
      babyId,
      height,
      weight,
      date: growthDate,
    })
    setGrowthHeight("")
    setGrowthWeight("")
    setShowAddGrowth(false)
  }

  const timelineGroups = useMemo(() => {
    const items: Array<{
      id: string
      dateKey: string
      timeText: string
      title: string
      description?: string
      createdByName?: string
      type: "photo" | "video" | "milestone" | "growth"
    }> = []

    babyPhotos.forEach((photo) => {
      const dateKey = photo.createdAt.split("T")[0]
      items.push({
        id: photo.id,
        dateKey,
        timeText: formatTime(photo.createdAt),
        title: photo.type === "photo" ? "拍了一张照片" : "拍了一段视频",
        description: photo.description,
        createdByName: photo.createdByName,
        type: photo.type,
      })
    })

    babyMilestones.forEach((milestone) => {
      items.push({
        id: milestone.id,
        dateKey: milestone.date,
        timeText: "",
        title: milestone.title,
        description: milestone.description,
        createdByName: milestone.createdByName,
        type: "milestone",
      })
    })

    babyGrowthRecords.forEach((record) => {
      items.push({
        id: record.id,
        dateKey: record.date,
        timeText: "",
        title: "更新了身高体重",
        description: `身高 ${record.height} cm · 体重 ${record.weight} kg`,
        createdByName: record.createdByName,
        type: "growth",
      })
    })

    const grouped: Record<string, typeof items> = {}
    items.forEach((item) => {
      if (!grouped[item.dateKey]) grouped[item.dateKey] = []
      grouped[item.dateKey].push(item)
    })

    return Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .map((dateKey) => ({
        dateKey,
        items: grouped[dateKey],
      }))
  }, [babyPhotos, babyMilestones, babyGrowthRecords])

  const filteredTimelineGroups = useMemo(() => {
    if (diaryTab === "all") return timelineGroups
    return timelineGroups
      .map((group) => ({
        dateKey: group.dateKey,
        items: group.items.filter((item) => item.type === diaryTab),
      }))
      .filter((group) => group.items.length > 0)
  }, [timelineGroups, diaryTab])

  if (!currentUser || !baby) {
    return null
  }

  const isAdmin = currentUser.role === "admin"

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold ml-2">宝宝主页</h1>
        {isAdmin && (
          <Link href={`/babies/${babyId}/edit`} className="ml-auto">
            <Button variant="outline" size="sm">编辑信息</Button>
          </Link>
        )}
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            {baby.avatar ? (
              <img src={baby.avatar} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-baby-pink to-baby-purple flex items-center justify-center">
                <span className="text-4xl">{baby.gender === "male" ? "👦" : "👧"}</span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{baby.name}</h2>
              <p className="text-gray-500">
                {baby.gender === "male" ? "男宝" : "女宝"} · {calculateAge(baby.birthDate)}
              </p>
              <p className="text-gray-400 text-sm">
                出生于 {new Date(baby.birthDate).toLocaleDateString("zh-CN")}
              </p>
            </div>
          </div>
          
        </CardContent>
      </Card>
      {showAddPhoto && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">添加照片/视频</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex space-x-2">
              <button
                onClick={() => setPhotoType("photo")}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  photoType === "photo" ? "bg-primary-500 text-white" : "bg-gray-200"
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>照片</span>
              </button>
              <button
                onClick={() => setPhotoType("video")}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  photoType === "video" ? "bg-primary-500 text-white" : "bg-gray-200"
                }`}
              >
                <Video className="w-4 h-4" />
                <span>视频</span>
              </button>
            </div>
            <div>
              <input
                type="file"
                accept={photoType === "photo" ? "image/*" : "video/*"}
                onChange={handlePhotoFileChange}
                className="hidden"
                id="media-input"
              />
              <label htmlFor="media-input">
                <Button type="button" variant="outline">
                  选择文件
                </Button>
              </label>
              {photoFileData && (
                <p className="text-xs text-gray-500 mt-2">已选择文件</p>
              )}
            </div>
            <Input
              placeholder="或粘贴链接（可选）"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
            <Input
              placeholder="描述（可选）"
              value={photoDesc}
              onChange={(e) => setPhotoDesc(e.target.value)}
            />
            <div className="flex space-x-2">
              <Button onClick={handleAddPhoto}>保存</Button>
              <Button variant="outline" onClick={() => setShowAddPhoto(false)}>取消</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showAddMilestone && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">添加里程碑</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="里程碑标题（如：第一次翻身）"
              value={milestoneTitle}
              onChange={(e) => setMilestoneTitle(e.target.value)}
            />
            <Input
              placeholder="描述（可选）"
              value={milestoneDesc}
              onChange={(e) => setMilestoneDesc(e.target.value)}
            />
            <Input
              type="date"
              value={milestoneDate}
              onChange={(e) => setMilestoneDate(e.target.value)}
            />
            <div className="flex space-x-2">
              <Button onClick={handleAddMilestone}>保存</Button>
              <Button variant="outline" onClick={() => setShowAddMilestone(false)}>取消</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showAddGrowth && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">添加身高体重</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="身高"
                type="number"
                value={growthHeight}
                onChange={(e) => setGrowthHeight(e.target.value)}
              />
              <Input
                placeholder="体重"
                type="number"
                value={growthWeight}
                onChange={(e) => setGrowthWeight(e.target.value)}
              />
            </div>
            <Input
              type="date"
              value={growthDate}
              onChange={(e) => setGrowthDate(e.target.value)}
            />
            <div className="flex space-x-2">
              <Button onClick={handleAddGrowth}>保存</Button>
              <Button variant="outline" onClick={() => setShowAddGrowth(false)}>取消</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">宝宝成长日记</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {[
              { key: "all", label: "全部" },
              { key: "photo", label: "照片" },
              { key: "video", label: "视频" },
              { key: "milestone", label: "里程碑" },
              { key: "growth", label: "身高体重" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setDiaryTab(tab.key as typeof diaryTab)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                  diaryTab === tab.key
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {filteredTimelineGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>暂无成长记录</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredTimelineGroups.map((group) => (
                <div key={group.dateKey}>
                  <p className="text-sm font-medium text-gray-700 mb-3">{formatDate(group.dateKey)}</p>
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                          {item.type === "photo" && <Camera className="w-5 h-5 text-primary-500" />}
                          {item.type === "video" && <Video className="w-5 h-5 text-primary-500" />}
                          {item.type === "milestone" && <Star className="w-5 h-5 text-yellow-500" />}
                          {item.type === "growth" && <TrendingUp className="w-5 h-5 text-green-500" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.title}</p>
                          {item.description && (
                            <p className="text-sm text-gray-500">{item.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {item.timeText ? `${item.timeText} · ` : ""}拍摄/提交：{item.createdByName || "未知"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
