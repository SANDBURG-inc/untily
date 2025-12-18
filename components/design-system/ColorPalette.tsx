"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"
import { Check, Copy } from "lucide-react"

type ColorItem = {
  name: string
  variable: string
  text: string
  border?: boolean
  oklch: string
  hex: string
}

const COLORS: { category: string; colors: ColorItem[] }[] = [
  {
    category: "브랜드 색상 (Brand)",
    colors: [
      { name: "Primary", variable: "bg-primary", text: "text-primary-foreground", oklch: "oklch(0.5465 0.2455 262.87)", hex: "#155DFC" },
      { name: "Primary Foreground", variable: "bg-primary-foreground", text: "text-primary", oklch: "oklch(0.985 0 0)", hex: "#FAFAFA" },
      { name: "Secondary", variable: "bg-secondary", text: "text-secondary-foreground", oklch: "oklch(0.97 0 0)", hex: "#F5F5F5" },
      { name: "Secondary Foreground", variable: "bg-secondary-foreground", text: "text-secondary", oklch: "oklch(0.205 0 0)", hex: "#030712" },
      { name: "Accent", variable: "bg-accent", text: "text-accent-foreground", oklch: "oklch(0.97 0 0)", hex: "#F5F5F5" },
    ]
  },
  {
    category: "상태 색상 (State)",
    colors: [
      { name: "Destructive", variable: "bg-destructive", text: "text-destructive-foreground", oklch: "oklch(0.577 0.245 27.325)", hex: "#DC2626" },
      { name: "Muted", variable: "bg-muted", text: "text-muted-foreground", oklch: "oklch(0.97 0 0)", hex: "#F5F5F5" },
      { name: "Muted Foreground", variable: "bg-muted-foreground", text: "text-white", oklch: "oklch(0.556 0 0)", hex: "#737373" },
    ]
  },
  {
    category: "UI 기본 (Base)",
    colors: [
      { name: "Background", variable: "bg-background", text: "text-foreground", border: true, oklch: "oklch(1 0 0)", hex: "#FFFFFF" },
      { name: "Foreground", variable: "bg-foreground", text: "text-background", oklch: "oklch(0.145 0 0)", hex: "#171717" },
      { name: "Card", variable: "bg-card", text: "text-card-foreground", border: true, oklch: "oklch(1 0 0)", hex: "#FFFFFF" },
      { name: "Popover", variable: "bg-popover", text: "text-popover-foreground", border: true, oklch: "oklch(1 0 0)", hex: "#FFFFFF" },
      { name: "Border", variable: "bg-border", text: "text-foreground", border: true, oklch: "oklch(0.922 0 0)", hex: "#E5E5E5" },
      { name: "Input", variable: "bg-input", text: "text-foreground", border: true, oklch: "oklch(0.922 0 0)", hex: "#E5E5E5" },
      { name: "Ring", variable: "bg-ring", text: "text-white", oklch: "oklch(0.708 0 0)", hex: "#A1A1A1" },
    ]
  },
  {
    category: "차트 (Charts)",
    colors: [
      { name: "Chart 1", variable: "bg-chart-1", text: "text-white", oklch: "oklch(0.646 0.222 41.116)", hex: "#E97451" },
      { name: "Chart 2", variable: "bg-chart-2", text: "text-white", oklch: "oklch(0.6 0.118 184.704)", hex: "#2A9D8F" },
      { name: "Chart 3", variable: "bg-chart-3", text: "text-white", oklch: "oklch(0.398 0.07 227.392)", hex: "#264653" },
      { name: "Chart 4", variable: "bg-chart-4", text: "text-foreground", oklch: "oklch(0.828 0.189 84.429)", hex: "#E9C46A" },
      { name: "Chart 5", variable: "bg-chart-5", text: "text-foreground", oklch: "oklch(0.769 0.188 70.08)", hex: "#F4A261" },
    ]
  }
]

function CopyableValue({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
      title={`${label} 복사`}
    >
      <span className="truncate">{value}</span>
      {copied ? (
        <Check className="w-3 h-3 text-green-500 shrink-0" />
      ) : (
        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </button>
  )
}

export function ColorPalette() {
  return (
    <div className="grid gap-8">
      {COLORS.map((group) => (
        <div key={group.category} className="space-y-3">
          <h3 className="font-semibold text-lg">{group.category}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {group.colors.map((color) => (
              <div key={color.name} className="space-y-2 group">
                <div
                  className={cn(
                    "h-24 rounded-lg shadow-sm flex items-end p-3 transition-transform hover:scale-105",
                    color.border && "border"
                  )}
                  style={{ backgroundColor: color.hex }}
                >
                  <span className={cn("text-xs font-medium opacity-90", color.text)}>
                    {color.name}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-medium">
                    {color.variable.replace('bg-', '')}
                  </div>
                  <CopyableValue value={color.hex} label="HEX" />
                  <CopyableValue value={color.oklch} label="OKLCH" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
