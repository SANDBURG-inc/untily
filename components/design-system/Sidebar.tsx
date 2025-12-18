"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

interface SidebarItem {
  title: string
  href: string
}

interface SidebarGroup {
  category: string
  items: SidebarItem[]
}

const GROUPS: SidebarGroup[] = [
  {
    category: "General",
    items: [
      { title: "소개", href: "#intro" },
      { title: "색상 팔레트", href: "#colors" },
      { title: "타이포그래피", href: "#typography" },
    ],
  },
  {
    category: "ShadCN",
    items: [
      { title: "Button", href: "#buttons" },
      { title: "Badge", href: "#badges" },
      { title: "Card", href: "#cards" },
      { title: "Switch", href: "#inputs" },
      { title: "Dialog", href: "#dialog" },
    ],
  },
  {
    category: "Custom",
    items: [
      { title: "PageHeader", href: "#page-header" },
      { title: "Table", href: "#table" },
    ],
  },
]

export function DesignSystemSidebar({ className }: { className?: string }) {
  const [query, setQuery] = React.useState("")

  // 검색 필터링된 그룹 생성
  const filteredGroups = GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter(group => group.items.length > 0)

  const hasResults = filteredGroups.some(group => group.items.length > 0)

  return (
    <div className={cn("w-64 shrink-0 h-screen sticky top-0 border-r bg-card/50 backdrop-blur-xl p-6 hidden lg:flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-xl tracking-tight">디자인 시스템</h1>
        <p className="text-sm text-muted-foreground">Untily 컴포넌트 라이브러리</p>
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
        {hasResults ? (
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <div key={group.category}>
                <h2 className="px-3 mb-1 text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  {group.category}
                </h2>
                <ul className="space-y-0.5 ml-2">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        className="block px-3 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">
            검색 결과가 없습니다
          </div>
        )}
      </nav>
      
      <div className="border-t pt-4">
        <p className="text-xs text-muted-foreground">
          v1.0.0 &copy; {new Date().getFullYear()} Untily
        </p>
      </div>
    </div>
  )
}
