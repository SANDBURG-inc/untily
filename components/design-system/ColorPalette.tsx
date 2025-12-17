"use client"

import { cn } from "@/lib/utils"

type ColorItem = {
  name: string
  variable: string
  text: string
  border?: boolean
}

const COLORS: { category: string; colors: ColorItem[] }[] = [
  {
    category: "브랜드 색상 (Brand)",
    colors: [
      { name: "Primary", variable: "bg-primary", text: "text-primary-foreground" },
      { name: "Secondary", variable: "bg-secondary", text: "text-secondary-foreground" },
      { name: "Accent", variable: "bg-accent", text: "text-accent-foreground" },
    ]
  },
  {
    category: "상태 색상 (State)",
    colors: [
      { name: "Destructive", variable: "bg-destructive", text: "text-destructive-foreground" },
      { name: "Muted", variable: "bg-muted", text: "text-muted-foreground" },
    ]
  },
  {
    category: "UI 기본 (Base)",
    colors: [
      { name: "Background", variable: "bg-background", text: "text-foreground", border: true },
      { name: "Card", variable: "bg-card", text: "text-card-foreground", border: true },
      { name: "Popover", variable: "bg-popover", text: "text-popover-foreground", border: true },
      { name: "Border", variable: "bg-border", text: "", border: true },
      { name: "Input", variable: "bg-input", text: "", border: true },
    ]
  },
  {
    category: "차트 (Charts)",
    colors: [
      { name: "Chart 1", variable: "bg-chart-1", text: "text-white" },
      { name: "Chart 2", variable: "bg-chart-2", text: "text-white" },
      { name: "Chart 3", variable: "bg-chart-3", text: "text-white" },
      { name: "Chart 4", variable: "bg-chart-4", text: "text-white" },
      { name: "Chart 5", variable: "bg-chart-5", text: "text-white" },
    ]
  }
]

export function ColorPalette() {
  return (
    <div className="grid gap-8">
      {COLORS.map((group) => (
        <div key={group.category} className="space-y-3">
          <h3 className="font-semibold text-lg">{group.category}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {group.colors.map((color) => (
              <div key={color.name} className="space-y-2 group">
                <div 
                  className={cn(
                    "h-24 rounded-lg shadow-sm flex items-end p-3 transition-transform hover:scale-105", 
                    color.variable,
                    color.border && "border"
                  )}
                >
                  <span className={cn("text-xs font-medium opacity-90", color.text)}>
                    {color.name}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {color.variable.replace('bg-', '')}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
