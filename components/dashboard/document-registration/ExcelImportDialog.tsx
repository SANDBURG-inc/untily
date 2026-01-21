'use client';

import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { Download, FileSpreadsheet, CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { FileDropZone } from '@/components/shared/FileDropZone';
import type { Submitter } from '@/lib/types/document';
import {
  downloadSubmitterTemplate,
  parseSubmittersFromExcel,
  mergeSubmitters,
  type ExcelParseResult,
  type ExcelValidationError,
} from '@/lib/utils/excel';

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingSubmitters: Submitter[];
  onImport: (submitters: Submitter[], mode: 'add' | 'replace') => void;
}

type ImportMode = 'add' | 'replace';

/**
 * Excel 파일로 제출자 일괄 등록하는 다이얼로그
 */
export function ExcelImportDialog({
  open,
  onOpenChange,
  existingSubmitters,
  onImport,
}: ExcelImportDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('add');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 다이얼로그 닫을 때 상태 초기화
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setParseResult(null);
      setSelectedFile(null);
      setImportMode('add');
    }
    onOpenChange(newOpen);
  };

  // 파일 드래그 앤 드롭 핸들러
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await processFile(file);
    }
  };

  // 파일 input 변경 핸들러
  const handleInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
    // input 초기화 (같은 파일 재선택 가능하도록)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 파일 선택 버튼 클릭
  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  // 선택된 파일 삭제
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setParseResult(null);
  };

  // 지원하는 스프레드시트 형식
  const SUPPORTED_EXTENSIONS = ['.xlsx', '.xls', '.csv', '.numbers'];

  // 파일 처리
  const processFile = async (file: File) => {
    // 지원 형식 검증
    const fileName = file.name.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.some(ext => fileName.endsWith(ext))) {
      setParseResult({
        success: false,
        data: [],
        errors: [{ row: 0, field: '', value: '', message: '지원하지 않는 파일 형식입니다.' }],
        totalRows: 0,
        validRows: 0,
        duplicateCount: 0,
      });
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const result = await parseSubmittersFromExcel(file);
      setParseResult(result);
    } finally {
      setIsProcessing(false);
    }
  };

  // 가져오기 실행
  const handleImport = () => {
    if (!parseResult || parseResult.validRows === 0) return;

    if (importMode === 'replace') {
      onImport(parseResult.data, 'replace');
    } else {
      // 기존 목록에 추가
      const { merged } = mergeSubmitters(existingSubmitters, parseResult.data);
      onImport(merged, 'add');
    }

    handleOpenChange(false);
  };

  // 에러 메시지 렌더링 (최대 5개)
  const renderErrors = (errors: ExcelValidationError[]) => {
    const maxDisplay = 5;
    const displayErrors = errors.slice(0, maxDisplay);
    const remaining = errors.length - maxDisplay;

    return (
      <div className="space-y-1">
        {displayErrors.map((error, index) => (
          <p key={index} className="text-sm text-red-600">
            {error.row > 0 ? `${error.row}행` : ''} {error.field && `[${error.field}]`} {error.message}
          </p>
        ))}
        {remaining > 0 && (
          <p className="text-sm text-red-600">외 {remaining}건의 오류가 있습니다.</p>
        )}
      </div>
    );
  };

  // 결과 영역 렌더링
  const renderResult = () => {
    if (!parseResult) return null;

    // 파싱 실패 (파일 형식 오류 등)
    if (!parseResult.success && parseResult.totalRows === 0) {
      return (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>{renderErrors(parseResult.errors)}</div>
          </div>
        </div>
      );
    }

    // 데이터 파싱 결과
    return (
      <div className="space-y-3">
        {/* 유효 데이터가 있을 때 */}
        {parseResult.validRows > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">
                {parseResult.totalRows === parseResult.validRows ? (
                  <>전체 <strong>{parseResult.validRows}명</strong>의 제출자를 가져올 수 있습니다.</>
                ) : (
                  <>파일의 {parseResult.totalRows}줄 중 <strong>{parseResult.validRows}명</strong>의 제출자를 가져올 수 있습니다.</>
                )}
              </span>
            </div>

            {/* 가져오기 방식 선택 */}
            {existingSubmitters.length > 0 && (
              <div className="space-y-1.5 ml-7">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="add"
                    checked={importMode === 'add'}
                    onChange={() => setImportMode('add')}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">
                    기존 목록에 추가 ({existingSubmitters.length}명 + {parseResult.validRows}명)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">
                    기존 목록 완전 대체 ({parseResult.validRows}명으로 대체)
                  </span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* 오류가 있을 때 */}
        {parseResult.errors.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800 mb-1">일부 데이터에 오류가 있습니다.</p>
                {renderErrors(parseResult.errors)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>스프레드시트로 제출자 가져오기</DialogTitle>
          <DialogDescription>
            Excel, CSV, Numbers 파일을 업로드하여 제출자를 일괄 등록할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 양식 다운로드 안내 */}
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                양식 파일을 다운로드하여 사용하세요.
              </span>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={downloadSubmitterTemplate}
            >
              <Download className="w-4 h-4" />
              양식 다운로드
            </Button>
          </div>

          {/* 파일 업로드 영역 또는 선택된 파일 표시 */}
          {selectedFile && parseResult && parseResult.totalRows > 0 ? (
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">{selectedFile.name}</span>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                aria-label="파일 삭제"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ) : (
            <FileDropZone
              isDragging={isDragging}
              disabled={isProcessing}
              accept=".xlsx,.xls,.csv,.numbers"
              fileInputRef={fileInputRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onInputChange={handleInputChange}
              onSelectClick={handleSelectClick}
              size="sm"
              hint="스프레드시트 파일을 드래그하거나 선택해주세요."
            />
          )}

          {/* 파싱 결과 */}
          {isProcessing ? (
            <div className="flex items-center justify-center py-4 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600 mr-2" />
              파일 분석 중...
            </div>
          ) : (
            renderResult()
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
            취소
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!parseResult || parseResult.validRows === 0 || isProcessing}
          >
            가져오기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
