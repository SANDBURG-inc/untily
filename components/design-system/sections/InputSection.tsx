"use client"

import { Switch } from "@/components/ui/switch"
import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"
import { Bell } from "lucide-react"

export function InputSection() {
  return (
    <ComponentShowcase 
      id="inputs" 
      title="선택 컨트롤" 
      description="스위치, 체크박스 및 기타 입력 메커니즘입니다."
    >
      <div className="grid gap-8 w-full max-w-xl">
        <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
          <div className="space-y-0.5">
            <label className="text-sm font-medium text-foreground block">이메일 알림</label>
            <p className="text-xs text-muted-foreground">일일 활동 요약을 받습니다.</p>
          </div>
          <Switch defaultChecked />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium text-foreground block">푸시 알림</label>
            </div>
          </div>
          <Switch />
        </div>
      </div>
    </ComponentShowcase>
  )
}
