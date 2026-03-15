export interface User {
  id: string
  phone: string
  password: string
  nickname: string
  avatar: string | null
  role: 'admin' | 'member'
  familyId: string
  createdAt: string
}

export interface Baby {
  id: string
  familyId: string
  name: string
  avatar: string | null
  gender: 'male' | 'female'
  birthDate: string
  createdAt: string
}

export interface FeedingRecord {
  id: string
  babyId: string
  familyId: string
  memberId: string
  memberName: string
  amount: number
  feedingTime: string
  durationMinutes?: number
  note: string
  createdAt: string
}

export interface Family {
  id: string
  name: string
  inviteCode: string
  adminId: string
  createdAt: string
}

export interface Photo {
  id: string
  babyId: string
  familyId: string
  url: string
  type: 'photo' | 'video'
  description: string
  createdById?: string
  createdByName?: string
  createdAt: string
}

export interface Milestone {
  id: string
  babyId: string
  familyId: string
  title: string
  description: string
  date: string
  createdById?: string
  createdByName?: string
  createdAt: string
}

export interface GrowthRecord {
  id: string
  babyId: string
  familyId: string
  height: number
  weight: number
  date: string
  createdById?: string
  createdByName?: string
  createdAt: string
}

export interface VaccineReminder {
  id: string
  babyId: string
  familyId: string
  name: string
  dueDate: string
  isCompleted: boolean
  createdAt: string
}

export interface FeedingReminder {
  id: string
  babyId: string
  familyId: string
  suggestedTime: string
  isCompleted: boolean
  createdAt: string
}
