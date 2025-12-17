"use client"

import { Badge } from "@/components/ui/badge"
import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"

export function BadgeSection() {
  return (
    <ComponentShowcase
      id="badges"
      title="뱃지"
      description="상태, 카테고리, 라벨 등을 표시하는 작은 텍스트 요소입니다."
    >
      <div className="flex flex-col gap-8 w-full">
        {/* Default Variants */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">기본 변형 (Variants)</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </div>

        {/* Custom Project Variants */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">프로젝트 커스텀</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <Badge variant="primary">Primary (#155DFC)</Badge>
            <Badge variant="required">필수</Badge>
            <Badge variant="optional">선택</Badge>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">사용 예시</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="primary">진행중</Badge>
              <span className="text-sm text-muted-foreground">문서함 상태 표시 (DocumentCard)</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="required">필수</Badge>
              <Badge variant="optional">선택</Badge>
              <span className="text-sm text-muted-foreground">서류 필수 여부 (RequiredDocumentCard)</span>
            </div>
          </div>
        </div>
      </div>
    </ComponentShowcase>
  )
}
