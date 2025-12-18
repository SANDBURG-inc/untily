"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { LogoUploadDialog } from "@/components/dashboard/LogoUploadDialog"
export function DialogSection() {
  const [logoDialogOpen, setLogoDialogOpen] = useState(false)

  return (
    <ComponentShowcase
      id="dialog"
      title="다이얼로그"
      description="사용자와의 중요한 상호작용을 위한 모달 오버레이입니다. 확인, 폼 입력, 알림 등에 사용됩니다."
    >
      <div className="flex flex-col gap-8 w-full">
        {/* 기본 다이얼로그 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            기본 (Basic)
          </h3>
          <div className="flex flex-wrap gap-4 items-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">기본 다이얼로그 열기</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>기본 다이얼로그</DialogTitle>
                  <DialogDescription>
                    기본적인 다이얼로그 예시입니다. 제목, 설명, 푸터를 포함할 수 있습니다.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">닫기</Button>
                  </DialogClose>
                  <Button variant="primary">확인</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 로고 업로드 다이얼로그 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            로고 업로드 (Logo Upload)
          </h3>
          <p className="text-sm text-muted-foreground">
            파일 업로드 기능이 포함된 다이얼로그입니다. 드래그 앤 드롭과 파일 선택을 지원합니다.
          </p>
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="primary" onClick={() => setLogoDialogOpen(true)}>
              로고 업로드
            </Button>
            <LogoUploadDialog
              open={logoDialogOpen}
              onOpenChange={setLogoDialogOpen}
              type="default"
              onUploadComplete={(url) => {
                console.log("Logo uploaded:", url)
                setLogoDialogOpen(false)
              }}
            />
          </div>
        </div>

        {/* 확인/경고 다이얼로그 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            확인/경고 (Confirmation)
          </h3>
          <p className="text-sm text-muted-foreground">
            위험한 작업 전 사용자 확인을 받을 때 사용합니다.
          </p>
          <div className="flex flex-wrap gap-4 items-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">삭제</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>정말 삭제하시겠습니까?</DialogTitle>
                  <DialogDescription>
                    이 작업은 되돌릴 수 없습니다. 해당 항목이 영구적으로 삭제됩니다.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">취소</Button>
                  </DialogClose>
                  <Button variant="destructive">삭제</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 닫기 버튼 없는 다이얼로그 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            옵션 (Options)
          </h3>
          <p className="text-sm text-muted-foreground">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">showCloseButton=false</code>
            {" "}로 우측 상단 X 버튼을 숨길 수 있습니다.
          </p>
          <div className="flex flex-wrap gap-4 items-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">닫기 버튼 없음</Button>
              </DialogTrigger>
              <DialogContent showCloseButton={false}>
                <DialogHeader>
                  <DialogTitle>닫기 버튼 없는 다이얼로그</DialogTitle>
                  <DialogDescription>
                    우측 상단의 X 버튼이 없습니다. 반드시 푸터의 버튼으로만 닫을 수 있습니다.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="primary">확인</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </ComponentShowcase>
  )
}
