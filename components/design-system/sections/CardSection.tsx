"use client"

import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { FileText, Users, Settings, History } from "lucide-react"

export function CardSection() {
  return (
    <ComponentShowcase
      id="cards"
      title="카드"
      description="관련된 콘텐츠와 액션을 그룹화하는 컨테이너입니다."
    >
      <div className="space-y-12 w-full max-w-4xl">
        {/* Variant 설명 */}
        <div className="bg-slate-50 rounded-lg p-4 text-sm">
          <h4 className="font-semibold text-slate-900 mb-2">Card Variants</h4>
          <ul className="space-y-1 text-slate-600">
            <li><code className="bg-slate-200 px-1 rounded">default</code> - shadcn 기본 스타일 (border, shadow, py-6, gap-6)</li>
            <li><code className="bg-slate-200 px-1 rounded">compact</code> - 상세 페이지용 (border-gray-200, no shadow, tight spacing px-6)</li>
            <li><code className="bg-slate-200 px-1 rounded">form</code> - 폼 페이지용 (no border, no shadow, wider spacing px-8)</li>
          </ul>
        </div>

        {/* Default Variant */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Default Variant</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>기본 카드</CardTitle>
                <CardDescription>shadcn 기본 스타일입니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">CardContent 영역</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>액션 슬롯</CardTitle>
                <CardDescription>CardAction으로 우측 액션 배치</CardDescription>
                <CardAction>
                  <Button size="sm" variant="outline">수정</Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">CardContent 영역</p>
              </CardContent>
              <CardFooter>
                <span className="text-xs text-muted-foreground">CardFooter 영역</span>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Compact Variant */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Compact Variant</h3>
          <p className="text-sm text-slate-600">상세 페이지용. SectionHeader와 함께 사용.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <Card variant="compact">
              <CardHeader variant="compact">
                <CardTitle>
                  <SectionHeader icon={FileText} title="제출 현황" />
                </CardTitle>
              </CardHeader>
              <CardContent variant="compact">
                <p className="text-sm text-muted-foreground">CardContent 영역</p>
              </CardContent>
            </Card>

            <Card variant="compact">
              <CardHeader variant="compact">
                <CardTitle>
                  <SectionHeader icon={History} title="리마인드 내역" />
                </CardTitle>
                <CardAction>
                  <Button size="sm" variant="outline-primary">발송</Button>
                </CardAction>
              </CardHeader>
              <CardContent variant="compact">
                <p className="text-sm text-muted-foreground">CardContent 영역</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Variant */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Form Variant</h3>
          <p className="text-sm text-slate-600">폼 페이지용. SectionHeader size=&quot;md&quot;와 함께 사용.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <Card variant="form">
              <CardHeader variant="form">
                <CardTitle>
                  <SectionHeader icon={FileText} title="기본 정보 입력" size="md" />
                </CardTitle>
              </CardHeader>
              <CardContent variant="form">
                <p className="text-sm text-muted-foreground">CardContent 영역 (px-8)</p>
              </CardContent>
            </Card>

            <Card variant="form">
              <CardHeader variant="form">
                <CardTitle>
                  <SectionHeader icon={Users} title="서류 제출자 등록" size="md" />
                </CardTitle>
                <CardAction>
                  <Switch defaultChecked />
                </CardAction>
              </CardHeader>
              <CardContent variant="form">
                <p className="text-sm text-muted-foreground">CardContent 영역 (px-8)</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SectionHeader Sizes */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">SectionHeader Sizes</h3>
          <div className="bg-white border rounded-lg p-6 space-y-6">
            <div className="flex items-center gap-8">
              <code className="bg-slate-100 px-2 py-1 rounded text-sm w-24">sm</code>
              <SectionHeader icon={Settings} title="섹션 타이틀" size="sm" />
            </div>
            <div className="flex items-center gap-8">
              <code className="bg-slate-100 px-2 py-1 rounded text-sm w-24">md</code>
              <SectionHeader icon={Settings} title="섹션 타이틀" size="md" />
            </div>
            <div className="flex items-center gap-8">
              <code className="bg-slate-100 px-2 py-1 rounded text-sm w-24">lg (기본)</code>
              <SectionHeader icon={Settings} title="섹션 타이틀" size="lg" />
            </div>
          </div>
        </div>
      </div>
    </ComponentShowcase>
  )
}
