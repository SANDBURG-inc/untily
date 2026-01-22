"use client"

import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"
import { LabeledProgress } from "@/components/shared/LabeledProgress"

export function LabeledProgressSection() {
  return (
    <ComponentShowcase
      id="labeled-progress"
      title="LabeledProgress"
      description="라벨과 진행률 값을 함께 표시하는 프로그레스 바입니다. components/shared/LabeledProgress.tsx"
    >
      <div className="flex flex-col gap-8 w-full">
        {/* Count 모드 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Count 모드 (기본값)
          </h3>
          <p className="text-sm text-muted-foreground">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">displayMode=&quot;count&quot;</code>
            {" "}- 제출 현황 등에 적합합니다. (예: 3/5)
          </p>
          <div className="border rounded-lg p-6 bg-background max-w-md">
            <LabeledProgress
              label="제출 진행률"
              current={3}
              total={5}
            />
          </div>
        </div>

        {/* Percentage 모드 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Percentage 모드
          </h3>
          <p className="text-sm text-muted-foreground">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">displayMode=&quot;percentage&quot;</code>
            {" "}- 진행률 퍼센트 표시에 적합합니다. (예: 60%)
          </p>
          <div className="border rounded-lg p-6 bg-background max-w-md">
            <LabeledProgress
              label="진행률"
              current={7}
              total={10}
              displayMode="percentage"
            />
          </div>
        </div>

        {/* 추가 옵션 설명 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            추가 옵션
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs">size</code>
              {" "}- 프로그레스 바 높이를 조절합니다. (sm: 8px, md: 10px, lg: 12px)
            </li>
            <li>
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs">showValue={"{false}"}</code>
              {" "}- 오른쪽 값 표시를 숨깁니다.
            </li>
          </ul>
        </div>
      </div>
    </ComponentShowcase>
  )
}
