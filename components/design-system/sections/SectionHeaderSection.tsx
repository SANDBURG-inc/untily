"use client"

import { SectionHeader } from "@/components/shared/SectionHeader"
import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"
import { FileText, Users, Settings, Bell } from "lucide-react"

export function SectionHeaderSection() {
  return (
    <ComponentShowcase
      id="section-header"
      title="섹션 헤더"
      description="카드나 섹션의 타이틀을 통일된 스타일로 렌더링합니다. 아이콘, 제목, 설명을 조합할 수 있습니다. components/shared/SectionHeader.tsx"
    >
      <div className="flex flex-col gap-8 w-full">
        {/* 크기 변형 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">크기 변형 (Size)</h3>
          <div className="space-y-6">
            <div className="p-4 border rounded-lg">
              <SectionHeader icon={FileText} title="Small (sm)" size="sm" />
              <p className="mt-2 text-sm text-muted-foreground">폼 입력 섹션에 적합</p>
            </div>
            <div className="p-4 border rounded-lg">
              <SectionHeader icon={Users} title="Medium (md)" size="md" />
              <p className="mt-2 text-sm text-muted-foreground">기본 섹션에 적합</p>
            </div>
            <div className="p-4 border rounded-lg">
              <SectionHeader icon={Settings} title="Large (lg)" size="lg" />
              <p className="mt-2 text-sm text-muted-foreground">상세 페이지 주요 섹션에 적합</p>
            </div>
          </div>
        </div>

        {/* 설명 포함 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">설명 포함</h3>
          <div className="p-4 border rounded-lg">
            <SectionHeader
              icon={Bell}
              title="알림 설정"
              description="리마인드 알림의 발송 시점과 방식을 설정합니다."
              size="lg"
            />
          </div>
        </div>

        {/* 아이콘 없이 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">아이콘 없이</h3>
          <div className="p-4 border rounded-lg">
            <SectionHeader
              title="기본 정보"
              description="문서함의 기본 정보를 입력합니다."
              size="md"
            />
          </div>
        </div>
      </div>
    </ComponentShowcase>
  )
}
