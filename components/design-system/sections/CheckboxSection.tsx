"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"

export function CheckboxSection() {
  const [checked, setChecked] = useState(false)
  const [terms, setTerms] = useState(false)

  return (
    <ComponentShowcase
      id="checkbox"
      title="체크박스"
      description="여러 옵션 중 하나 이상을 선택하거나, 동의 여부를 확인하는 컴포넌트입니다."
    >
      <div className="flex flex-col gap-8 w-full">
        {/* 기본 상태 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">기본 상태</h3>
          <div className="flex flex-wrap gap-8 items-center">
            <div className="flex items-center gap-2">
              <Checkbox
                id="basic"
                checked={checked}
                onCheckedChange={(v) => setChecked(v === true)}
              />
              <label htmlFor="basic" className="text-sm cursor-pointer">
                {checked ? "선택됨" : "선택 안됨"}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="disabled" disabled />
              <label htmlFor="disabled" className="text-sm text-muted-foreground">
                비활성화
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="checked-disabled" checked disabled />
              <label htmlFor="checked-disabled" className="text-sm text-muted-foreground">
                체크 + 비활성화
              </label>
            </div>
          </div>
        </div>

        {/* 사용 예시 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">사용 예시</h3>
          <div className="space-y-4 max-w-md">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Checkbox
                id="terms"
                checked={terms}
                onCheckedChange={(v) => setTerms(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed">
                <span className="font-medium">서비스 이용약관</span>에 동의합니다.
                개인정보 수집 및 이용에 동의하며, 만 14세 이상임을 확인합니다.
              </label>
            </div>
          </div>
        </div>
      </div>
    </ComponentShowcase>
  )
}
