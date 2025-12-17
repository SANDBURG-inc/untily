"use client"

import { Button } from "@/components/ui/Button"
import { IconButton } from "@/components/shared/IconButton"
import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"
import { Plus, Save, Trash2, Send, Settings } from "lucide-react"

export function ButtonSection() {
  return (
    <ComponentShowcase 
      id="buttons" 
      title="버튼" 
      description="액션을 트리거하는 상호작용 요소입니다. 기본 버튼과 아이콘이 포함된 변형을 포함합니다."
    >
      <div className="flex flex-col gap-8 w-full">
        {/* Variants */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">기본 변형 (Variants)</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </div>

        {/* Custom Project Variants */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">프로젝트 커스텀</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="primary">Primary (Blue)</Button>
            <Button variant="outline-primary">Outline Primary</Button>
          </div>
        </div>

        {/* Sizes */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">크기 (Sizes)</h3>
          <div className="flex flex-wrap items-end gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon"><Settings className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Icon Buttons (Shared) */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">아이콘 버튼 (IconButton)</h3>
          <p className="text-sm text-muted-foreground mb-2">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">@/components/shared/IconButton</code>
            {" "}- shadcn Button을 래핑하여 아이콘 + 텍스트 조합을 편리하게 제공. <code className="bg-muted px-1.5 py-0.5 rounded text-xs">as=&quot;link&quot;</code>로 Next.js Link 지원.
          </p>
          <div className="flex flex-wrap gap-4">
            <IconButton icon={<Plus />}>새로 만들기</IconButton>
            <IconButton icon={<Save />} variant="secondary">변경사항 저장</IconButton>
            <IconButton icon={<Trash2 />} variant="destructive">삭제</IconButton>
            <IconButton icon={<Send />} variant="outline-primary" iconPosition="right">보내기</IconButton>
          </div>
        </div>
      </div>
    </ComponentShowcase>
  )
}
