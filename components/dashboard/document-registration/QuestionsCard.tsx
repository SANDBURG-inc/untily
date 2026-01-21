'use client';

import { Plus } from 'lucide-react';
import { IconButton } from '@/components/shared/IconButton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { QuestionCard } from './questions';
import { useQuestions } from '@/lib/hooks/useQuestions';
import type { FormFieldData } from '@/lib/types/form-field';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface QuestionsCardProps {
  /** 질문 목록 (폼 필드) */
  questions: FormFieldData[];
  /** 질문 변경 핸들러 */
  onQuestionsChange: (questions: FormFieldData[]) => void;
  /** 표시 위치 설정 (true: 수집 서류 위, false: 아래) */
  formFieldsAboveDocuments: boolean;
  /** 표시 위치 변경 핸들러 */
  onFormFieldsAboveDocumentsChange: (above: boolean) => void;
}

/**
 * QuestionsCard 컴포넌트
 *
 * 정보 입력 항목(질문)을 등록하는 카드 컴포넌트입니다.
 * 구글 폼 스타일로 각 질문이 개별 카드로 표시됩니다.
 * 드래그 앤 드롭으로 질문 순서를 변경할 수 있습니다.
 */
export function QuestionsCard({
  questions,
  onQuestionsChange,
  formFieldsAboveDocuments,
  onFormFieldsAboveDocumentsChange,
}: QuestionsCardProps) {
  // 커스텀 훅으로 상태 관리 로직 분리
  const {
    addQuestion,
    removeQuestion,
    updateQuestion,
    duplicateQuestion,
  } = useQuestions(questions, onQuestionsChange);

  // 드래그 앤 드롭 센서 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * 드래그 종료 핸들러
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      const newQuestions = arrayMove(questions, oldIndex, newIndex);
      // order 재정렬
      onQuestionsChange(newQuestions.map((q, i) => ({ ...q, order: i })));
    }
  };

  // 질문이 없으면 추가 버튼만 표시
  if (questions.length === 0) {
    return (
      <div>
        <IconButton
          type="button"
          variant="secondary"
          icon={<Plus className="w-4 h-4" />}
          onClick={addQuestion}
          className="w-full"
        >
          질문 추가
        </IconButton>
      </div>
    );
  }

  return (
    <>
      {/* 표시 위치 설정 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm font-normal text-gray-700 mb-3">
          제출자 화면에서 표시 위치
        </p>
        <RadioGroup
          value={formFieldsAboveDocuments ? 'above' : 'below'}
          onValueChange={(value) =>
            onFormFieldsAboveDocumentsChange(value === 'above')
          }
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="above" id="position-above" />
            <Label htmlFor="position-above" className="text-sm text-gray-600 cursor-pointer">
              수집 서류 위
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="below" id="position-below" />
            <Label htmlFor="position-below" className="text-sm text-gray-600 cursor-pointer">
              수집 서류 아래
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* 질문 목록 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={questions.map((q) => q.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {questions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onUpdate={(updates) => updateQuestion(question.id, updates)}
                onRemove={() => removeQuestion(question.id)}
                onDuplicate={() => duplicateQuestion(question.id)}
              />
            ))}

            {/* 질문 추가 버튼 */}
            <IconButton
              type="button"
              variant="secondary"
              icon={<Plus className="w-4 h-4" />}
              onClick={addQuestion}
              className="w-full"
            >
              질문 추가
            </IconButton>
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}
