"use client"

import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"
import { User } from "lucide-react"

export function CardSection() {
  return (
    <ComponentShowcase 
      id="cards" 
      title="카드" 
      description="관련된 콘텐츠와 액션을 그룹화하는 컨테이너입니다."
    >
      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Simple Card */}
        <Card>
          <CardHeader>
            <CardTitle>기본 카드</CardTitle>
            <CardDescription>콘텐츠를 담는 기본적인 컨테이너입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80">
              카드는 조합 가능한 문법을 사용하여 만들어집니다. 헤더, 콘텐츠, 푸터를 쉽게 혼합하고 매칭할 수 있습니다.
            </p>
          </CardContent>
        </Card>

        {/* Card with Action */}
        <Card>
          <CardHeader>
            <CardTitle>인터랙티브 카드</CardTitle>
            <CardDescription>헤더에 액션 슬롯이 포함되어 있습니다.</CardDescription>
            <CardAction>
              <Button size="sm" variant="outline">수정</Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 py-2">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="text-blue-600 h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">사용자 프로필</div>
                <div className="text-xs text-muted-foreground">관리자 권한</div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <span className="text-xs text-muted-foreground">최근 업데이트: 2분 전</span>
            <Switch defaultChecked />
          </CardFooter>
        </Card>
      </div>
    </ComponentShowcase>
  )
}
