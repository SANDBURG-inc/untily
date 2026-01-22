"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface TimePickerProps {
  /** 선택된 시간 (HH:mm 형식) */
  value: string | undefined
  /** 시간 변경 핸들러 */
  onTimeChange: (time: string) => void
  /** 플레이스홀더 텍스트 */
  placeholder?: string
  /** 비활성화 여부 */
  disabled?: boolean
  /** 추가 CSS 클래스 */
  className?: string
}

/**
 * TimePicker 컴포넌트
 *
 * 키보드 입력과 드롭다운 선택 모두 가능한 하이브리드 시간 선택 컴포넌트입니다.
 * Tab으로 오전/오후 → 시 → 분 순서로 자연스럽게 이동합니다.
 */
export function TimePicker({
  value,
  onTimeChange,
  placeholder = "시간 선택",
  disabled = false,
  className,
}: TimePickerProps) {
  // 24시간 형식을 오전/오후, 시간, 분으로 파싱
  const parseTime = (timeStr: string | undefined) => {
    if (!timeStr) return { period: 'AM', hour: '', minute: '' }
    const [h, m] = timeStr.split(':')
    const hourNum = parseInt(h, 10)
    const period = hourNum < 12 ? 'AM' : 'PM'
    const displayHour = hourNum === 0 ? '12' : hourNum > 12 ? String(hourNum - 12) : String(hourNum)
    // 분은 앞에 0 없이 자연스럽게 (01 → 1, 00 → 0)
    const displayMinute = String(parseInt(m, 10))
    return { period, hour: displayHour, minute: displayMinute }
  }

  // 오전/오후, 시간, 분을 24시간 형식으로 변환 (HH:mm)
  const formatTime = (period: string, hour: string, minute: string) => {
    if (!hour || minute === '') return ''
    let hourNum = parseInt(hour, 10)
    const minNum = parseInt(minute, 10)
    if (isNaN(hourNum) || hourNum < 1 || hourNum > 12) return ''
    if (isNaN(minNum) || minNum < 0 || minNum > 59) return ''
    if (period === 'AM') {
      hourNum = hourNum === 12 ? 0 : hourNum
    } else {
      hourNum = hourNum === 12 ? 12 : hourNum + 12
    }
    // 최종 값만 HH:mm 형식으로 패딩
    return `${String(hourNum).padStart(2, '0')}:${String(minNum).padStart(2, '0')}`
  }

  const parsed = parseTime(value)
  const [period, setPeriod] = useState(parsed.period)
  const [hour, setHour] = useState(parsed.hour)
  const [minute, setMinute] = useState(parsed.minute)

  const [periodOpen, setPeriodOpen] = useState(false)
  const [hourOpen, setHourOpen] = useState(false)
  const [minuteOpen, setMinuteOpen] = useState(false)

  const hourInputRef = useRef<HTMLInputElement>(null)
  const minuteInputRef = useRef<HTMLInputElement>(null)

  // 외부 value 변경 시 내부 상태 동기화
  useEffect(() => {
    const parsed = parseTime(value)
    setPeriod(parsed.period)
    setHour(parsed.hour)
    setMinute(parsed.minute)
  }, [value])

  // 값 변경 시 부모에 알림
  const notifyChange = (newPeriod: string, newHour: string, newMinute: string) => {
    const formatted = formatTime(newPeriod, newHour, newMinute)
    if (formatted) {
      onTimeChange(formatted)
    }
  }

  // 오전/오후 변경
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod)
    setPeriodOpen(false)
    notifyChange(newPeriod, hour, minute)
    hourInputRef.current?.focus()
  }

  // 시간 입력 핸들러
  const handleHourInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2)
    setHour(val)

    const hourNum = parseInt(val, 10)
    if (hourNum >= 1 && hourNum <= 12 && minute !== '') {
      notifyChange(period, val, minute)
    }

    // 2자리이고 유효한 범위면 분으로 이동
    if (val.length === 2 && hourNum >= 1 && hourNum <= 12) {
      minuteInputRef.current?.focus()
    }
  }

  // 시간 blur 시 검증
  const handleHourBlur = () => {
    if (hour) {
      let hourNum = parseInt(hour, 10)
      if (hourNum < 1) hourNum = 1
      if (hourNum > 12) hourNum = 12
      const formatted = String(hourNum)
      setHour(formatted)
      if (minute !== '') {
        notifyChange(period, formatted, minute)
      }
    }
  }

  // 시간 선택 핸들러
  const handleHourSelect = (selectedHour: string) => {
    setHour(selectedHour)
    setHourOpen(false)
    const newMinute = minute === '' ? '0' : minute
    notifyChange(period, selectedHour, newMinute)
    if (minute === '') setMinute('0')
    minuteInputRef.current?.focus()
  }

  // 분 입력 핸들러
  const handleMinuteInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2)
    setMinute(val)

    const minNum = parseInt(val, 10)
    if (hour && !isNaN(minNum) && minNum >= 0 && minNum <= 59) {
      notifyChange(period, hour, val)
    }
  }

  // 분 blur 시 검증
  const handleMinuteBlur = () => {
    if (minute !== '') {
      let minNum = parseInt(minute, 10)
      if (isNaN(minNum) || minNum < 0) minNum = 0
      if (minNum > 59) minNum = 59
      const formatted = String(minNum)
      setMinute(formatted)
      if (hour) {
        notifyChange(period, hour, formatted)
      }
    }
  }

  // 분 선택 핸들러
  const handleMinuteSelect = (selectedMinute: string) => {
    setMinute(selectedMinute)
    setMinuteOpen(false)
    if (hour) {
      notifyChange(period, hour, selectedMinute)
    }
  }

  // 시간 옵션 (1-12)
  const hours = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i))

  // 분 옵션 (0-59, 패딩 없이)
  const minutes = Array.from({ length: 60 }, (_, i) => String(i))

  const inputBaseClass = cn(
    "h-9 border border-input rounded-md bg-background text-sm text-left",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50"
  )

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* 오전/오후 선택 */}
      <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              inputBaseClass,
              "w-[72px] px-2 flex items-center justify-between gap-1"
            )}
          >
            <span>{period === 'AM' ? '오전' : '오후'}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[72px] p-1" align="start">
          <div className="flex flex-col">
            {['AM', 'PM'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePeriodChange(p)}
                className={cn(
                  "px-2 py-1.5 text-sm rounded hover:bg-accent text-left",
                  period === p && "bg-accent"
                )}
              >
                {p === 'AM' ? '오전' : '오후'}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* 시간 입력 */}
      <div className="relative flex items-center">
        <input
          ref={hourInputRef}
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={hour}
          onChange={handleHourInput}
          onBlur={handleHourBlur}
          placeholder="시"
          className={cn(inputBaseClass, "w-[44px] pl-2")}
        />
        <Popover open={hourOpen} onOpenChange={setHourOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className="absolute right-1 p-0.5 hover:bg-accent rounded"
              onClick={(e) => {
                e.preventDefault()
                setHourOpen(!hourOpen)
              }}
            >
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[72px] p-1 max-h-[240px] overflow-y-auto" align="start">
            <div className="flex flex-col">
              {hours.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleHourSelect(h)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded hover:bg-accent text-left",
                    hour === h && "bg-accent"
                  )}
                >
                  {h}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <span className="text-gray-400">:</span>

      {/* 분 입력 */}
      <div className="relative flex items-center">
        <input
          ref={minuteInputRef}
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={minute}
          onChange={handleMinuteInput}
          onBlur={handleMinuteBlur}
          placeholder="분"
          className={cn(inputBaseClass, "w-[44px] pl-2")}
        />
        <Popover open={minuteOpen} onOpenChange={setMinuteOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className="absolute right-1 p-0.5 hover:bg-accent rounded"
              onClick={(e) => {
                e.preventDefault()
                setHourOpen(false)
                setMinuteOpen(!minuteOpen)
              }}
            >
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[72px] p-1 max-h-[240px] overflow-y-auto" align="start">
            <div className="flex flex-col">
              {minutes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMinuteSelect(m)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded hover:bg-accent text-left",
                    minute === m && "bg-accent"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
