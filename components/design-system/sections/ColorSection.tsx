"use client"

import { ColorPalette } from "@/components/design-system/ColorPalette"

export function ColorSection() {
  return (
    <section id="colors" className="scroll-mt-20 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">색상 팔레트</h2>
        <p className="text-muted-foreground">
          <code className="text-sm bg-muted px-1.5 py-0.5 rounded">globals.css</code>에 정의된 핵심 색상 시스템입니다.
        </p>
      </div>
      <ColorPalette />
    </section>
  )
}
