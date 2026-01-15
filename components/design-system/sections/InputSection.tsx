"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"
import { Search, Mail } from "lucide-react"

export function InputSection() {
  const [value, setValue] = useState("")
  const [email, setEmail] = useState("")

  return (
    <ComponentShowcase
      id="input"
      title="입력 필드"
      description="텍스트, 이메일, 비밀번호 등 다양한 형태의 입력을 받는 컴포넌트입니다. components/ui/input.tsx"
    >
      <div className="flex flex-col gap-8 w-full">
        {/* 기본 상태 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">기본 상태</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div className="space-y-2">
              <label className="text-sm font-medium">기본</label>
              <Input
                placeholder="텍스트를 입력하세요"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">비활성화</label>
              <Input placeholder="비활성화됨" disabled />
            </div>
          </div>
        </div>

        {/* 타입별 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">타입별 (Types)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
            <div className="space-y-2">
              <label className="text-sm font-medium">텍스트</label>
              <Input type="text" placeholder="이름" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">이메일</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">비밀번호</label>
              <Input type="password" placeholder="••••••••" />
            </div>
          </div>
        </div>

        {/* 에러 상태 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">에러 상태</h3>
          <p className="text-sm text-muted-foreground">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">error=true</code>로 에러 상태를 표시합니다.
          </p>
          <div className="max-w-md space-y-2">
            <Input
              type="email"
              placeholder="email@example.com"
              error
              defaultValue="invalid-email"
            />
            <p className="text-sm text-destructive">올바른 이메일 형식이 아닙니다.</p>
          </div>
        </div>

        {/* 아이콘과 함께 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">아이콘과 함께</h3>
          <p className="text-sm text-muted-foreground">
            Input을 wrapper div로 감싸서 아이콘과 조합할 수 있습니다.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div className="space-y-2">
              <label className="text-sm font-medium">검색</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="검색어를 입력하세요" className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">이메일</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="이메일" className="pl-9" />
              </div>
            </div>
          </div>
        </div>

        {/* 사용 예시 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">사용 예시</h3>
          <div className="p-4 border rounded-lg max-w-md space-y-4">
            <h4 className="font-medium">문서함 기본 정보</h4>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  문서함 이름<span className="text-destructive">*</span>
                </label>
                <Input placeholder="예: 2024년 연말정산 서류 제출" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">설명</label>
                <Input placeholder="문서함에 대한 간단한 설명" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ComponentShowcase>
  )
}
