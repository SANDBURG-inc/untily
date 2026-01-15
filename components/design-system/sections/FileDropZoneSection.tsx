"use client"

import { useRef, useState, type DragEvent, type ChangeEvent } from "react"
import { FileDropZone } from "@/components/shared/FileDropZone"
import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"
import { FileText } from "lucide-react"

export function FileDropZoneSection() {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) setSelectedFile(file)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleSelectClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <ComponentShowcase
      id="file-drop-zone"
      title="파일 드롭 영역"
      description="파일을 드래그 앤 드롭하거나 직접 선택할 수 있는 영역입니다. 서류 업로드에 사용됩니다. components/shared/FileDropZone.tsx"
    >
      <div className="flex flex-col gap-8 w-full">
        {/* 기본 사용 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">기본 사용</h3>
          <div className="max-w-md">
            <FileDropZone
              isDragging={isDragging}
              fileInputRef={fileInputRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onInputChange={handleInputChange}
              onSelectClick={handleSelectClick}
              accept=".pdf,.jpg,.jpeg,.png"
              hint="PDF, JPG, PNG 파일을 드래그하거나 선택해주세요."
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-green-600">
                선택된 파일: {selectedFile.name}
              </p>
            )}
          </div>
        </div>

        {/* 크기 변형 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">크기 변형</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <p className="text-sm font-medium mb-2">Small (sm)</p>
              <FileDropZone
                isDragging={false}
                fileInputRef={{ current: null }}
                onDragOver={() => {}}
                onDragLeave={() => {}}
                onDrop={() => {}}
                onInputChange={() => {}}
                onSelectClick={() => {}}
                size="sm"
                hint="작은 모달용"
              />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Large (lg) - 기본값</p>
              <FileDropZone
                isDragging={false}
                fileInputRef={{ current: null }}
                onDragOver={() => {}}
                onDragLeave={() => {}}
                onDrop={() => {}}
                onInputChange={() => {}}
                onSelectClick={() => {}}
                size="lg"
                hint="큰 모달용"
              />
            </div>
          </div>
        </div>

        {/* 프리뷰 포함 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">프리뷰 포함</h3>
          <div className="max-w-md">
            <FileDropZone
              isDragging={false}
              fileInputRef={{ current: null }}
              onDragOver={() => {}}
              onDragLeave={() => {}}
              onDrop={() => {}}
              onInputChange={() => {}}
              onSelectClick={() => {}}
              preview={
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">document.pdf</p>
                    <p className="text-xs text-muted-foreground">1.2 MB</p>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </ComponentShowcase>
  )
}
