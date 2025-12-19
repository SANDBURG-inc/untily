"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select"
import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"

export function SelectSection() {
  return (
    <ComponentShowcase
      id="select"
      title="Select"
      description="드롭다운 선택 컴포넌트입니다. 여러 옵션 중 하나를 선택할 때 사용합니다."
    >
      <div className="grid gap-8 w-full max-w-2xl mx-auto">
        {/* 기본 Select */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">기본</label>
          <Select>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="옵션 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">옵션 1</SelectItem>
              <SelectItem value="option2">옵션 2</SelectItem>
              <SelectItem value="option3">옵션 3</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 크기 비교 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">크기 (size)</label>
          <div className="flex items-center gap-4">
            <Select>
              <SelectTrigger size="sm" className="w-[160px]">
                <SelectValue placeholder="Small" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm1">Small 옵션 1</SelectItem>
                <SelectItem value="sm2">Small 옵션 2</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger size="default" className="w-[180px]">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="df1">Default 옵션 1</SelectItem>
                <SelectItem value="df2">Default 옵션 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 그룹화 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">그룹화</label>
          <Select>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="과일 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>과일</SelectLabel>
                <SelectItem value="apple">사과</SelectItem>
                <SelectItem value="banana">바나나</SelectItem>
                <SelectItem value="orange">오렌지</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>채소</SelectLabel>
                <SelectItem value="carrot">당근</SelectItem>
                <SelectItem value="broccoli">브로콜리</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* 비활성화 상태 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">비활성화</label>
          <div className="flex items-center gap-4">
            <Select disabled>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="비활성화됨" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disabled">선택 불가</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="항목 비활성화" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">활성 항목</SelectItem>
                <SelectItem value="disabled" disabled>비활성 항목</SelectItem>
                <SelectItem value="active2">활성 항목 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 실제 사용 예시 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">실제 사용 예시</label>
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-background">
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="제출상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="submitted">제출완료</SelectItem>
                <SelectItem value="partial">부분제출</SelectItem>
                <SelectItem value="pending">미제출</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">← 제출자 목록 필터링</span>
          </div>
        </div>
      </div>
    </ComponentShowcase>
  )
}
