"use client"

import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"
import { PageHeader } from "@/components/shared/PageHeader"
import { IconButton } from "@/components/shared/IconButton"
import { Plus } from "lucide-react"

export function PageHeaderSection() {
  return (
    <ComponentShowcase
      id="page-header"
      title="PageHeader"
      description="페이지 제목과 설명을 표준화된 스타일로 표시합니다. components/shared/PageHeader.tsx"
    >
      <div className="flex flex-col gap-8 w-full">
        {/* 좌측 정렬 + 액션 버튼 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            좌측 정렬 + 액션 버튼
          </h3>
          <p className="text-sm text-muted-foreground">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">align=&quot;left&quot;</code> (기본값)
            {" "}- 액션 버튼과 함께 사용할 때 적합합니다.
          </p>
          <div className="border rounded-lg p-6 bg-background">
            <PageHeader
              title="문서함 목록"
              description="등록된 문서함을 관리합니다."
              actions={
                <IconButton icon={<Plus className="h-4 w-4" />} variant="primary" size="sm">
                  새 문서함
                </IconButton>
              }
            />
          </div>
        </div>

        {/* 중앙 정렬 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            중앙 정렬
          </h3>
          <p className="text-sm text-muted-foreground">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">align=&quot;center&quot;</code>
            {" "}- 제출 페이지 등 단독 사용 시 적합합니다.
          </p>
          <div className="border rounded-lg p-6 bg-background">
            <PageHeader
              title="서류 제출"
              description="요청받은 서류를 제출해주세요."
              align="center"
            />
          </div>
        </div>

        {/* 제목만 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            제목만
          </h3>
          <p className="text-sm text-muted-foreground">
            description 없이 제목만 표시할 수도 있습니다.
          </p>
          <div className="border rounded-lg p-6 bg-background">
            <PageHeader title="설정" />
          </div>
        </div>
      </div>
    </ComponentShowcase>
  )
}
