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
import FileUploadDialog from "@/components/submit/upload/FileUploadDialog"
import { ChevronDown, ChevronUp } from "lucide-react"

// 사용 컴포넌트 데모 데이터
const usedComponents = [
  {
    name: "LogoUploadDialog",
    path: "components/dashboard/LogoUploadDialog.tsx",
    description: "로고 이미지 업로드 (드래그앤드롭, 파일선택)",
    demoType: "logo" as const,
  },
  {
    name: "FileUploadDialog",
    path: "components/submit/upload/FileUploadDialog.tsx",
    description: "파일 업로드 (단일/복수, 유효성 검사)",
    demoType: "fileUpload" as const,
  },
  {
    name: "AutoReminderSettings",
    path: "components/dashboard/AutoReminderSettings.tsx",
    description: "자동 리마인드 채널 선택 (이메일/문자/알림톡)",
    demoType: "reminder" as const,
  },
]

export function DialogSection() {
  const [logoDialogOpen, setLogoDialogOpen] = useState(false)
  const [expandedDemo, setExpandedDemo] = useState<string | null>(null)
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false)
  const [fileUploadDialogOpen, setFileUploadDialogOpen] = useState(false)
  const [fileUploadMultiDialogOpen, setFileUploadMultiDialogOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const toggleDemo = (name: string) => {
    setExpandedDemo(expandedDemo === name ? null : name)
  }

  return (
    <ComponentShowcase
      id="dialog"
      title="다이얼로그"
      description="사용자와의 중요한 상호작용을 위한 모달 오버레이입니다. 확인, 폼 입력, 알림 등에 사용됩니다. components/ui/dialog.tsx"
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

        {/* 이 컴포넌트를 사용한 컴포넌트 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            이 컴포넌트를 사용한 컴포넌트
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            컴포넌트 이름을 클릭하면 데모를 확인할 수 있습니다.
          </p>
          <div className="border rounded-lg overflow-hidden">
            {usedComponents.map((comp) => (
              <div key={comp.name} className="border-b last:border-b-0">
                {/* 클릭 가능한 헤더 */}
                <button
                  onClick={() => toggleDemo(comp.name)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{comp.name}</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {comp.path}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground hidden md:inline">
                      {comp.description}
                    </span>
                    {expandedDemo === comp.name ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* 확장되는 데모 영역 */}
                {expandedDemo === comp.name && (
                  <div className="p-4 bg-muted/30 border-t">
                    {comp.demoType === "logo" && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          로고 이미지를 업로드하는 다이얼로그입니다. 드래그앤드롭과 파일 선택을 지원합니다.
                        </p>
                        <Button variant="primary" size="sm" onClick={() => setLogoDialogOpen(true)}>
                          LogoUploadDialog 열기
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
                    )}
                    {comp.demoType === "fileUpload" && (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          파일을 업로드하는 다이얼로그입니다. 단일/복수 파일 모드를 지원하며, 파일 유효성 검사(크기, 확장자, ZIP 내용)를 수행합니다.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="primary" size="sm" onClick={() => setFileUploadDialogOpen(true)}>
                            단일 파일 업로드
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => setFileUploadMultiDialogOpen(true)}>
                            복수 파일 업로드
                          </Button>
                        </div>
                        {selectedFile && (
                          <p className="text-sm text-green-600">
                            단일 모드 선택: {selectedFile.name}
                          </p>
                        )}
                        {selectedFiles.length > 0 && (
                          <p className="text-sm text-green-600">
                            복수 모드 선택: {selectedFiles.map(f => f.name).join(", ")}
                          </p>
                        )}
                        <FileUploadDialog
                          open={fileUploadDialogOpen}
                          onOpenChange={setFileUploadDialogOpen}
                          onFileSelect={(file) => {
                            setSelectedFile(file)
                            console.log("Single file selected:", file.name)
                          }}
                          title="서류 업로드하기"
                        />
                        <FileUploadDialog
                          open={fileUploadMultiDialogOpen}
                          onOpenChange={setFileUploadMultiDialogOpen}
                          multiple
                          onFilesSelect={(files) => {
                            setSelectedFiles(files)
                            console.log("Multiple files selected:", files.map(f => f.name))
                          }}
                          title="서류 업로드하기 (복수)"
                        />
                      </div>
                    )}
                    {comp.demoType === "reminder" && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          자동 리마인드 채널을 선택하는 다이얼로그입니다. 이메일/문자/알림톡 중 선택합니다.
                        </p>
                        <Button variant="primary" size="sm" onClick={() => setReminderDialogOpen(true)}>
                          채널 선택 다이얼로그 열기
                        </Button>
                        <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-bold text-gray-900">
                                리마인드 채널 선택
                              </DialogTitle>
                              <DialogDescription className="text-sm text-gray-600 leading-relaxed">
                                마감일 3일 전, 미제출자에게 자동으로 알림을 발송합니다.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 py-4">
                              <div className="flex items-center gap-3 p-4 border rounded-lg border-blue-500 bg-blue-50/50">
                                <div className="flex items-center justify-center w-5 h-5 rounded bg-blue-600 text-white">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <span className="text-gray-900 font-medium">이메일로 발송할게요</span>
                              </div>
                              <div className="flex items-center gap-3 p-4 border rounded-lg border-gray-200 bg-gray-50 opacity-50">
                                <div className="w-5 h-5 border border-gray-300 rounded bg-white" />
                                <span className="text-gray-500">문자로 발송할게요</span>
                              </div>
                              <div className="flex items-center gap-3 p-4 border rounded-lg border-gray-200 bg-gray-50 opacity-50">
                                <div className="w-5 h-5 border border-gray-300 rounded bg-white" />
                                <span className="text-gray-500">알림톡으로 발송할게요</span>
                              </div>
                            </div>
                            <DialogFooter className="flex gap-2 sm:flex-row">
                              <Button variant="soft" onClick={() => setReminderDialogOpen(false)} className="flex-1">
                                취소
                              </Button>
                              <Button variant="primary" onClick={() => setReminderDialogOpen(false)} className="flex-1">
                                선택완료
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ComponentShowcase>
  )
}
