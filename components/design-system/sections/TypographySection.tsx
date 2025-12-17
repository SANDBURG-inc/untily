"use client"

import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"

export function TypographySection() {
  return (
    <section id="typography" className="scroll-mt-20">
      <ComponentShowcase 
        title="타이포그래피" 
        description="확장 가능하고 반응형인 서체 시스템입니다."
      >
        <div className="space-y-8 max-w-3xl">
          <div className="space-y-2">
            <div className="text-4xl font-extrabold tracking-tight lg:text-5xl">Heading 1</div>
            <p className="text-sm text-muted-foreground">Extrabold 4xl/5xl - 메인 페이지 타이틀</p>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold tracking-tight">Heading 2</div>
            <p className="text-sm text-muted-foreground">Bold 3xl - 섹션 헤더</p>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold tracking-tight">Heading 3</div>
            <p className="text-sm text-muted-foreground">Bold 2xl - 카드 타이틀 / 서브 섹션</p>
          </div>
          <div className="space-y-2">
            <div className="text-xl font-semibold tracking-tight">Heading 4</div>
            <p className="text-sm text-muted-foreground">Semibold xl - 컴포넌트 헤더</p>
          </div>
          <div className="space-y-2">
            <p className="leading-7 not-first:mt-6">
              이것은 <code className="text-sm bg-muted rounded px-1">leading-7</code> 스타일이 적용된 표준 단락입니다.
              긴 글을 읽을 때 최적의 가독성을 보장합니다. 다람쥐 헌 쳇바퀴에 타고파.
            </p>
          </div>
        </div>
      </ComponentShowcase>
    </section>
  )
}
