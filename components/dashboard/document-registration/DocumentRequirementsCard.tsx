'use client';

import { Plus, X, FileText, ChevronDown } from 'lucide-react';
import type { DocumentRequirement } from '@/lib/types/document';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconButton } from '@/components/shared/IconButton';

interface DocumentRequirementsCardProps {
  /** 서류 요구사항 목록 */
  requirements: DocumentRequirement[];
  /** 서류 요구사항 목록 변경 핸들러 */
  onRequirementsChange: (requirements: DocumentRequirement[]) => void;
}

/**
 * DocumentRequirementsCard 컴포넌트
 *
 * 수집할 서류 정보를 등록하는 카드 컴포넌트입니다.
 * 서류명, 유형(필수/옵션), 설명을 입력받습니다.
 */
export function DocumentRequirementsCard({
  requirements,
  onRequirementsChange,
}: DocumentRequirementsCardProps) {
  /**
   * 새 서류 요구사항 추가
   */
  const addRequirement = () => {
    const newRequirement: DocumentRequirement = {
      id: Date.now().toString(),
      name: '',
      type: '필수',
      description: '',
    };
    onRequirementsChange([...requirements, newRequirement]);
  };

  /**
   * 서류 요구사항 업데이트
   */
  const updateRequirement = (
    id: string,
    field: keyof DocumentRequirement,
    value: string
  ) => {
    onRequirementsChange(
      requirements.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  /**
   * 서류 요구사항 삭제
   */
  const removeRequirement = (id: string) => {
    onRequirementsChange(requirements.filter((r) => r.id !== id));
  };

  return (
    <Card className="mb-6 py-0 shadow-none">
      <CardHeader className="pb-0 pt-8 px-8">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="w-5 h-5 text-gray-700" />
          수집 서류 등록
        </CardTitle>
      </CardHeader>

      <CardContent className="px-8 pb-8 pt-6">
        <div className="space-y-4">
          {requirements.map((requirement) => (
            <div
              key={requirement.id}
              className="relative border border-gray-200 rounded-lg p-4"
            >
              {/* 삭제 버튼 (서류가 2개 이상일 때만 표시) */}
              {requirements.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRequirement(requirement.id)}
                  className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* 서류명 입력 */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    서류명<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={requirement.name}
                    onChange={(e) =>
                      updateRequirement(requirement.id, 'name', e.target.value)
                    }
                    placeholder="예: 주민등록등본"
                    className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                    required
                  />
                </div>

                {/* 서류 유형 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    서류 유형<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={requirement.type}
                      onChange={(e) =>
                        updateRequirement(requirement.id, 'type', e.target.value)
                      }
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white appearance-none pr-10 text-gray-700"
                      required
                    >
                      <option value="필수">필수</option>
                      <option value="옵션">옵션</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 서류 설명 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  설명
                </label>
                <input
                  type="text"
                  value={requirement.description}
                  onChange={(e) =>
                    updateRequirement(requirement.id, 'description', e.target.value)
                  }
                  placeholder="예: 3개월 이내 발급"
                  className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
              </div>
            </div>
          ))}

          {/* 서류 추가 버튼 */}
          <IconButton
            type="button"
            variant="secondary"
            icon={<Plus className="w-4 h-4" />}
            onClick={addRequirement}
            className="w-full"
          >
            서류 추가
          </IconButton>
        </div>
      </CardContent>
    </Card>
  );
}
