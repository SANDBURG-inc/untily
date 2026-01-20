"use client"

import * as React from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  /** 선택된 날짜 */
  date: Date | undefined
  /** 날짜 변경 핸들러 */
  onDateChange: (date: Date | undefined) => void
  /** 플레이스홀더 텍스트 */
  placeholder?: string
  /** 비활성화 여부 */
  disabled?: boolean
  /** 추가 CSS 클래스 */
  className?: string
}

/**
 * DatePicker 컴포넌트
 *
 * Calendar와 Popover를 조합한 날짜 선택 컴포넌트입니다.
 * 한국어 로케일을 기본으로 사용합니다.
 *
 * @example
 * ```tsx
 * const [date, setDate] = useState<Date | undefined>(undefined)
 *
 * <DatePicker
 *   date={date}
 *   onDateChange={setDate}
 *   placeholder="날짜를 선택하세요"
 * />
 * ```
 */
export function DatePicker({
  date,
  onDateChange,
  placeholder = "날짜 선택",
  disabled = false,
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-fit justify-start text-left font-normal h-9 text-sm gap-2 p-2",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 opacity-50" />
          <span>
            {date ? format(date, "M월 d일 (EEEE)", { locale: ko }) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          locale={ko}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
