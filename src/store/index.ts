import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Baby, Family, FeedingRecord, Photo, Milestone, GrowthRecord, VaccineReminder, FeedingReminder } from '@/types'
import { generateId, generateInviteCode } from '@/lib/utils'

interface AppState {
  currentUser: User | null
  family: Family | null
  members: User[]
  babies: Baby[]
  feedingRecords: FeedingRecord[]
  photos: Photo[]
  milestones: Milestone[]
  growthRecords: GrowthRecord[]
  vaccineReminders: VaccineReminder[]
  feedingReminders: FeedingReminder[]
  hasHydrated: boolean
  
  setCurrentUser: (user: User | null) => void
  updateUser: (updates: Partial<User>) => void
  
  setFamily: (family: Family | null) => void
  createFamily: (name: string, adminId: string) => Family
  
  addMember: (member: User) => void
  updateMember: (id: string, updates: Partial<User>) => void
  removeMember: (id: string) => void
  setMembers: (members: User[]) => void
  setBabies: (babies: Baby[]) => void
  setFeedingRecords: (records: FeedingRecord[]) => void
  hydrateFamilyData: (familyId: string) => Promise<void>
  
  addBaby: (baby: Omit<Baby, 'id' | 'familyId' | 'createdAt'>) => Promise<Baby>
  updateBaby: (id: string, updates: Partial<Baby>) => void
  removeBaby: (id: string) => void
  
  addFeedingRecord: (record: Omit<FeedingRecord, 'id' | 'familyId' | 'createdAt'>) => Promise<FeedingRecord>
  updateFeedingRecord: (id: string, updates: Partial<FeedingRecord>) => void
  removeFeedingRecord: (id: string) => void
  
  addPhoto: (photo: Omit<Photo, 'id' | 'familyId' | 'createdAt'>) => Photo
  removePhoto: (id: string) => void
  
  addMilestone: (milestone: Omit<Milestone, 'id' | 'familyId' | 'createdAt'>) => Milestone
  updateMilestone: (id: string, updates: Partial<Milestone>) => void
  removeMilestone: (id: string) => void
  
  addGrowthRecord: (record: Omit<GrowthRecord, 'id' | 'familyId' | 'createdAt'>) => GrowthRecord
  removeGrowthRecord: (id: string) => void
  
  addVaccineReminder: (reminder: Omit<VaccineReminder, 'id' | 'familyId' | 'createdAt'>) => VaccineReminder
  updateVaccineReminder: (id: string, updates: Partial<VaccineReminder>) => void
  removeVaccineReminder: (id: string) => void
  
  addFeedingReminder: (reminder: Omit<FeedingReminder, 'id' | 'familyId' | 'createdAt'>) => FeedingReminder
  updateFeedingReminder: (id: string, updates: Partial<FeedingReminder>) => void
  removeFeedingReminder: (id: string) => void
  setHasHydrated: (value: boolean) => void
  
  logout: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      family: null,
      members: [],
      babies: [],
      feedingRecords: [],
      photos: [],
      milestones: [],
      growthRecords: [],
      vaccineReminders: [],
      feedingReminders: [],
      hasHydrated: false,
      
      setCurrentUser: (user) => set({ currentUser: user }),
      
      updateUser: (updates) => {
        const { currentUser, members } = get()
        if (!currentUser) return
        const updatedUser = { ...currentUser, ...updates }
        set({ 
          currentUser: updatedUser,
          members: members.map(m => m.id === currentUser.id ? updatedUser : m)
        })
      },
      
      setFamily: (family) => set({ family }),
      
      createFamily: (name, adminId) => {
        const family: Family = {
          id: generateId(),
          name,
          inviteCode: generateInviteCode(),
          adminId,
          createdAt: new Date().toISOString(),
        }
        
        set({ family })
        
        return family
      },
      
      addMember: (member) => set((state) => ({ members: [...state.members, member] })),
      
      updateMember: (id, updates) => set((state) => ({
        members: state.members.map(m => m.id === id ? { ...m, ...updates } : m)
      })),
      
      removeMember: (id) => set((state) => ({
        members: state.members.filter(m => m.id !== id)
      })),
      
      setMembers: (members) => set({ members }),

      setBabies: (babies) => set({ babies }),

      setFeedingRecords: (feedingRecords) => set({ feedingRecords }),

      hydrateFamilyData: async (familyId) => {
        const localBabies = get().babies
        const localFeedingRecords = get().feedingRecords
        const isAdmin = get().currentUser?.role === "admin"

        const fetchJson = async (url: string) => {
          const res = await fetch(url)
          if (!res.ok) {
            const data = await res.json().catch(() => null)
            throw new Error(data?.error || "请求失败")
          }
          return res.json()
        }

        const babiesRes = await fetchJson(`/api/babies?familyId=${encodeURIComponent(familyId)}`).catch(
          () => null
        )
        const feedingRecordsRes = await fetchJson(
          `/api/feeding-records?familyId=${encodeURIComponent(familyId)}`
        ).catch(() => null)

        const remoteBabies = Array.isArray(babiesRes) ? babiesRes : null
        const remoteFeedingRecords = Array.isArray(feedingRecordsRes) ? feedingRecordsRes : null

        if (
          isAdmin &&
          remoteBabies &&
          remoteFeedingRecords &&
          remoteBabies.length === 0 &&
          remoteFeedingRecords.length === 0 &&
          (localBabies.length > 0 || localFeedingRecords.length > 0)
        ) {
          await Promise.allSettled([
            ...localBabies.map((b) =>
              fetch("/api/babies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(b),
              })
            ),
            ...localFeedingRecords.map((r) =>
              fetch("/api/feeding-records", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(r),
              })
            ),
          ])

          const babiesRes2 = await fetchJson(`/api/babies?familyId=${encodeURIComponent(familyId)}`).catch(
            () => null
          )
          const feedingRecordsRes2 = await fetchJson(
            `/api/feeding-records?familyId=${encodeURIComponent(familyId)}`
          ).catch(() => null)

          const remoteBabies2 = Array.isArray(babiesRes2) ? babiesRes2 : null
          const remoteFeedingRecords2 = Array.isArray(feedingRecordsRes2) ? feedingRecordsRes2 : null

          if (remoteBabies2) set({ babies: remoteBabies2 })
          if (remoteFeedingRecords2) set({ feedingRecords: remoteFeedingRecords2 })
          return
        }

        if (remoteBabies) set({ babies: remoteBabies })
        if (remoteFeedingRecords) set({ feedingRecords: remoteFeedingRecords })
      },
      
      addBaby: async (babyData) => {
        const { family } = get()
        if (!family) throw new Error('No family')
        
        const baby: Baby = {
          ...babyData,
          id: generateId(),
          familyId: family.id,
          createdAt: new Date().toISOString(),
        }
        
        const res = await fetch("/api/babies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(baby),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.error || "请求失败")
        }

        set((state) => ({ babies: [...state.babies, baby] }))
        return baby
      },
      
      updateBaby: (id, updates) => set((state) => ({
        babies: state.babies.map(b => b.id === id ? { ...b, ...updates } : b)
      })),
      
      removeBaby: (id) => set((state) => ({
        babies: state.babies.filter(b => b.id !== id)
      })),
      
      addFeedingRecord: async (recordData) => {
        const { family } = get()
        if (!family) throw new Error('No family')
        
        const record: FeedingRecord = {
          ...recordData,
          id: generateId(),
          familyId: family.id,
          createdAt: new Date().toISOString(),
        }
        
        const res = await fetch("/api/feeding-records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.error || "请求失败")
        }

        set((state) => ({ feedingRecords: [...state.feedingRecords, record] }))
        return record
      },
      
      updateFeedingRecord: (id, updates) => set((state) => ({
        feedingRecords: state.feedingRecords.map(r => r.id === id ? { ...r, ...updates } : r)
      })),
      
      removeFeedingRecord: (id) => set((state) => ({
        feedingRecords: state.feedingRecords.filter(r => r.id !== id)
      })),
      
      addPhoto: (photoData) => {
        const { family, currentUser } = get()
        if (!family) throw new Error('No family')
        
        const photo: Photo = {
          ...photoData,
          id: generateId(),
          familyId: family.id,
          createdById: currentUser?.id,
          createdByName: currentUser?.nickname || currentUser?.phone?.slice(-4),
          createdAt: new Date().toISOString(),
        }
        
        set((state) => ({ photos: [...state.photos, photo] }))
        return photo
      },
      
      removePhoto: (id) => set((state) => ({
        photos: state.photos.filter(p => p.id !== id)
      })),
      
      addMilestone: (milestoneData) => {
        const { family, currentUser } = get()
        if (!family) throw new Error('No family')
        
        const milestone: Milestone = {
          ...milestoneData,
          id: generateId(),
          familyId: family.id,
          createdById: currentUser?.id,
          createdByName: currentUser?.nickname || currentUser?.phone?.slice(-4),
          createdAt: new Date().toISOString(),
        }
        
        set((state) => ({ milestones: [...state.milestones, milestone] }))
        return milestone
      },
      
      updateMilestone: (id, updates) => set((state) => ({
        milestones: state.milestones.map(m => m.id === id ? { ...m, ...updates } : m)
      })),
      
      removeMilestone: (id) => set((state) => ({
        milestones: state.milestones.filter(m => m.id !== id)
      })),
      
      addGrowthRecord: (recordData) => {
        const { family, currentUser } = get()
        if (!family) throw new Error('No family')
        
        const record: GrowthRecord = {
          ...recordData,
          id: generateId(),
          familyId: family.id,
          createdById: currentUser?.id,
          createdByName: currentUser?.nickname || currentUser?.phone?.slice(-4),
          createdAt: new Date().toISOString(),
        }
        
        set((state) => ({ growthRecords: [...state.growthRecords, record] }))
        return record
      },
      
      removeGrowthRecord: (id) => set((state) => ({
        growthRecords: state.growthRecords.filter(r => r.id !== id)
      })),
      
      addVaccineReminder: (reminderData) => {
        const { family } = get()
        if (!family) throw new Error('No family')
        
        const reminder: VaccineReminder = {
          ...reminderData,
          id: generateId(),
          familyId: family.id,
          createdAt: new Date().toISOString(),
        }
        
        set((state) => ({ vaccineReminders: [...state.vaccineReminders, reminder] }))
        return reminder
      },
      
      updateVaccineReminder: (id, updates) => set((state) => ({
        vaccineReminders: state.vaccineReminders.map(r => r.id === id ? { ...r, ...updates } : r)
      })),
      
      removeVaccineReminder: (id) => set((state) => ({
        vaccineReminders: state.vaccineReminders.filter(r => r.id !== id)
      })),
      
      addFeedingReminder: (reminderData) => {
        const { family } = get()
        if (!family) throw new Error('No family')
        
        const reminder: FeedingReminder = {
          ...reminderData,
          id: generateId(),
          familyId: family.id,
          createdAt: new Date().toISOString(),
        }
        
        set((state) => ({ feedingReminders: [...state.feedingReminders, reminder] }))
        return reminder
      },
      
      updateFeedingReminder: (id, updates) => set((state) => ({
        feedingReminders: state.feedingReminders.map(r => r.id === id ? { ...r, ...updates } : r)
      })),
      
      removeFeedingReminder: (id) => set((state) => ({
        feedingReminders: state.feedingReminders.filter(r => r.id !== id)
      })),

      setHasHydrated: (value) => set({ hasHydrated: value }),
      
      logout: () => set({
        currentUser: null,
        family: null,
        members: [],
        babies: [],
        feedingRecords: [],
        photos: [],
        milestones: [],
        growthRecords: [],
        vaccineReminders: [],
        feedingReminders: [],
        hasHydrated: true,
      }),
    }),
    {
      name: 'baby-feeding-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
