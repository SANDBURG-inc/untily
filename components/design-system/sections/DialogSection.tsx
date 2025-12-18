"use client"

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
export function DialogSection() {
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

        {/* 폼 다이얼로그 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            폼 입력 (Form)
          </h3>
          <p className="text-sm text-muted-foreground">
            폼 요소를 포함한 다이얼로그입니다. 사용자 입력을 받을 때 사용합니다.
          </p>
          <div className="flex flex-wrap gap-4 items-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="primary">프로필 수정</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>프로필 수정</DialogTitle>
                  <DialogDescription>
                    프로필 정보를 수정합니다. 완료 후 저장 버튼을 클릭하세요.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="name" className="text-right text-sm font-medium">
                      이름
                    </label>
                    <input
                      id="name"
                      defaultValue="홍길동"
                      className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="email" className="text-right text-sm font-medium">
                      이메일
                    </label>
                    <input
                      id="email"
                      defaultValue="hong@example.com"
                      className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">취소</Button>
                  </DialogClose>
                  <Button variant="primary">저장</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
