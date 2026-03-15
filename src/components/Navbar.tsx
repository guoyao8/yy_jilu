"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAppStore } from "@/store"
import { Home, BarChart3, User, Baby } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "喂养", icon: Home },
  { href: "/statistics", label: "记录", icon: BarChart3 },
  { href: "/growth", label: "成长", icon: Baby },
  { href: "/settings", label: "我的", icon: User },
]

export default function Navbar() {
  const pathname = usePathname()
  const { currentUser } = useAppStore()

  if (!currentUser || pathname === "/login" || pathname === "/register") {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors",
                  isActive ? "text-primary-600" : "text-gray-500"
                )}
              >
                <Icon className={cn("w-5 h-5 mb-1", isActive && "text-primary-600")} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
