"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SEND_TIME_OPTIONS } from "@/lib/types/reminder"

interface TimeSelectProps {
  /** 선택된 시간 (HH:mm 형식) */
  value: string
  /** 시간 변경 핸들러 */
  onValueChange: (value: string) => void
  /** 플레이스홀더 텍스트 */
  placeholder?: string
  /** 비활성화 여부 */
  disabled?: boolean
  /** 추가 CSS 클래스 */
  className?: string
  /** Trigger 크기 */
  size?: "sm" | "default"
  /** Chevron 아이콘 표시 여부 (기본값: true) */
  showChevron?: boolean
}

/**
 * TimeSelect 컴포넌트
 *
 * 30분 단위로 시간을 선택할 수 있는 드롭다운 컴포넌트입니다.
 * AM/PM 형식으로 시간을 표시합니다.
 *
 * @example
 * ```tsx
 * const [time, setTime] = useState("09:00")
 *
 * <TimeSelect
 *   value={time}
 *   onValueChange={setTime}
 *   placeholder="시간 선택"
 * />
 * ```
 */
export function TimeSelect({
  value,
  onValueChange,
  placeholder = "시간 선택",
  disabled = false,
  className,
  size = "default",
  showChevron = true,
}: TimeSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "min-w-[60px]",
          size === "sm" ? "h-8 text-sm" : "h-9 text-sm",
          className
        )}
        size={size}
        showChevron={showChevron}
      >
        <SelectValue placeholder={placeholder}>
          {value}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        position="popper"
        className="[&_[data-slot=select-scroll-up-button]]:hidden [&_[data-slot=select-scroll-down-button]]:hidden"
        viewportClassName="!max-h-[180px]"
      >
        {SEND_TIME_OPTIONS.map((time) => (
          <SelectItem key={time} value={time}>
            {time}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
