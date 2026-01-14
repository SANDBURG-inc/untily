"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"
import { Bell } from "lucide-react"

export function SwitchSection() {
  const [enabled, setEnabled] = useState(false)
  const [autoReminder, setAutoReminder] = useState(true)
  const [emailNotification, setEmailNotification] = useState(true)
  const [pushNotification, setPushNotification] = useState(false)

  return (
    <ComponentShowcase
      id="switch"
      title="스위치"
      description="ON/OFF 토글 상태를 전환하는 컴포넌트입니다. 설정 옵션에 주로 사용됩니다. components/ui/switch.tsx"
    >
      <div className="flex flex-col gap-8 w-full">
        {/* 기본 상태 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">기본 상태</h3>
          <div className="flex flex-wrap gap-8 items-center">
            <div className="flex items-center gap-3">
              <Switch checked={enabled} onCheckedChange={setEnabled} />
              <span className="text-sm">{enabled ? "활성화" : "비활성화"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Switch disabled />
              <span className="text-sm text-muted-foreground">비활성화됨</span>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked disabled />
              <span className="text-sm text-muted-foreground">체크 + 비활성화</span>
            </div>
          </div>
        </div>

        {/* 사용 예시 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">사용 예시</h3>
          <div className="space-y-4 max-w-md">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium">자동 리마인드</div>
                <div className="text-sm text-muted-foreground">마감일 전 자동으로 알림을 발송합니다</div>
              </div>
              <Switch checked={autoReminder} onCheckedChange={setAutoReminder} />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-foreground block">이메일 알림</label>
                <p className="text-xs text-muted-foreground">일일 활동 요약을 받습니다.</p>
              </div>
              <Switch checked={emailNotification} onCheckedChange={setEmailNotification} />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium text-foreground block">푸시 알림</label>
                </div>
              </div>
              <Switch checked={pushNotification} onCheckedChange={setPushNotification} />
            </div>
          </div>
        </div>

        {/* 이 컴포넌트를 사용한 컴포넌트 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            이 컴포넌트를 사용한 컴포넌트
          </h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">컴포넌트</th>
                  <th className="text-left p-3 font-medium">파일 경로</th>
                  <th className="text-left p-3 font-medium">용도</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3 font-medium">AutoReminderSettings</td>
                  <td className="p-3 text-muted-foreground text-xs">components/dashboard/AutoReminderSettings.tsx</td>
                  <td className="p-3 text-muted-foreground">자동 리마인드 활성화/비활성화 토글</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ComponentShowcase>
  )
}
