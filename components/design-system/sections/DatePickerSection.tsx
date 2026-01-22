"use client"

import { useState } from "react"
import { DatePicker } from "@/components/ui/date-picker"
import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"

export function DatePickerSection() {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [deadline, setDeadline] = useState<Date | undefined>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))

  return (
    <ComponentShowcase
      id="date-picker"
      title="날짜 선택"
      description="Calendar와 Popover를 조합한 날짜 선택 컴포넌트입니다. 한국어 로케일이 기본 적용됩니다."
    >
      <div className="flex flex-col gap-8 w-full">
        {/* 기본 상태 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">기본 상태</h3>
          <div className="flex flex-wrap gap-8 items-start">
            <div className="space-y-2 w-64">
              <label className="text-sm font-medium">기본</label>
              <DatePicker
                date={date}
                onDateChange={setDate}
                placeholder="날짜를 선택하세요"
              />
            </div>
            <div className="space-y-2 w-64">
              <label className="text-sm font-medium text-muted-foreground">비활성화</label>
              <DatePicker
                date={undefined}
                onDateChange={() => {}}
                disabled
                placeholder="선택 불가"
              />
            </div>
          </div>
        </div>

        {/* 사용 예시 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">사용 예시</h3>
          <div className="space-y-4 max-w-md">
            <div className="p-4 border rounded-lg space-y-3">
              <div>
                <div className="font-medium">문서 제출 마감일</div>
                <div className="text-sm text-muted-foreground">서류 제출 마감 날짜를 지정합니다</div>
              </div>
              <DatePicker
                date={deadline}
                onDateChange={setDeadline}
                placeholder="마감일 선택"
              />
            </div>
          </div>
        </div>
      </div>
    </ComponentShowcase>
  )
}
