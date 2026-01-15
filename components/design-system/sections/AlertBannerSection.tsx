"use client"

import { AlertBanner } from "@/components/shared/AlertBanner"
import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"

export function AlertBannerSection() {
  return (
    <ComponentShowcase
      id="alert-banner"
      title="알림 배너"
      description="사용자에게 정보, 경고, 에러, 성공 메시지를 전달하는 배너 컴포넌트입니다. components/shared/AlertBanner.tsx"
    >
      <div className="flex flex-col gap-8 w-full">
        {/* 타입별 변형 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">타입별 변형</h3>
          <div className="space-y-4 max-w-2xl">
            <AlertBanner
              type="info"
              message="제출 마감일이 3일 남았습니다. 서류 제출을 서둘러 주세요."
            />
            <AlertBanner
              type="success"
              message="모든 서류가 성공적으로 제출되었습니다."
            />
            <AlertBanner
              type="warning"
              message="일부 제출자가 아직 서류를 제출하지 않았습니다."
            />
            <AlertBanner
              type="error"
              message="파일 업로드에 실패했습니다. 다시 시도해 주세요."
            />
          </div>
        </div>

        {/* 사용 예시 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">사용 예시</h3>
          <div className="p-4 border rounded-lg max-w-2xl space-y-4">
            <h4 className="font-medium">문서함 상세 페이지</h4>
            <AlertBanner
              type="info"
              message="이 문서함의 제출 링크를 제출자에게 공유하세요. 링크를 통해 서류를 제출할 수 있습니다."
            />
          </div>
        </div>
      </div>
    </ComponentShowcase>
  )
}
