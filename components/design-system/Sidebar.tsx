"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

interface SidebarItem {
  title: string
  href: string
}

const ITEMS: SidebarItem[] = [
  { title: "소개", href: "#intro" },
  { title: "색상 팔레트", href: "#colors" },
  { title: "타이포그래피", href: "#typography" },
  { title: "버튼", href: "#buttons" },
  { title: "카드", href: "#cards" },
  { title: "선택 컨트롤", href: "#inputs" },
]

export function DesignSystemSidebar({ className }: { className?: string }) {
  const [query, setQuery] = React.useState("")

  const filteredItems = ITEMS.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className={cn("w-64 shrink-0 h-screen sticky top-0 border-r bg-card/50 backdrop-blur-xl p-6 hidden lg:flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-xl tracking-tight">Design System</h1>
        <p className="text-sm text-muted-foreground">Untily Experience Language</p>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="컴포넌트 검색..."
          className="w-full bg-secondary/50 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring transition-all"
        />
      </div>

      <nav className="flex-1 overflow-y-auto -mx-2 px-2 no-scrollbar">
        <ul className="space-y-1">
          {filteredItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="block px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {item.title}
              </a>
            </li>
          ))}
          {filteredItems.length === 0 && (
            <li className="px-3 py-4 text-sm text-muted-foreground text-center">
              검색 결과가 없습니다
            </li>
          )}
        </ul>
      </nav>
      
      <div className="border-t pt-4">
        <p className="text-xs text-muted-foreground">
          v1.0.0 &copy; {new Date().getFullYear()} Untily
        </p>
      </div>
    </div>
  )
}
