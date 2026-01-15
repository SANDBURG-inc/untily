"use client"

import { StatCard } from "@/components/dashboard/detail/StatCard"
import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"

export function StatCardSection() {
  return (
    <ComponentShowcase
      id="stat-card"
      title="통계 카드"
      description="라벨과 값을 표시하는 간단한 통계 카드입니다. 대시보드 메트릭 표시에 사용됩니다. components/dashboard/detail/StatCard.tsx"
    >
      <div className="flex flex-col gap-8 w-full">
        {/* 기본 사용 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">기본 사용</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
            <StatCard label="생성일" value="2024.01.15" />
            <StatCard label="마감일" value="2024.01.31" />
            <StatCard label="제출자 수" value="24명" />
            <StatCard label="제출률" value="75%" />
          </div>
        </div>

        {/* 커스텀 색상 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">커스텀 색상</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-xl">
            <StatCard label="완료" value="18명" valueClassName="text-green-600" />
            <StatCard label="미제출" value="6명" valueClassName="text-red-600" />
            <StatCard label="D-Day" value="D-3" valueClassName="text-blue-600" />
          </div>
        </div>

        {/* 사용 예시 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">사용 예시</h3>
          <div className="p-4 border rounded-lg max-w-2xl">
            <h4 className="font-medium mb-3">제출 현황</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="생성일" value="2024.01.15" />
              <StatCard label="마감일" value="2024.01.31" />
              <StatCard label="제출 완료" value="18명" valueClassName="text-green-600" />
              <StatCard label="미제출" value="6명" valueClassName="text-red-600" />
            </div>
          </div>
        </div>
      </div>
    </ComponentShowcase>
  )
}
