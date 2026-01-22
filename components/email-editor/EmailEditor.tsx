'use client';

/**
 * ============================================================================
 * TipTap 기반 이메일 에디터 컴포넌트
 * ============================================================================
 *
 * @description
 * 이메일 템플릿의 인사말/아랫말을 편집하는 WYSIWYG 에디터입니다.
 * TipTap(ProseMirror 기반)을 사용하여 리치 텍스트 편집 기능을 제공합니다.
 *
 * @features
 * - Bold, Italic, 형광펜(하이라이트), 링크
 * - BulletList, OrderedList, Blockquote
 * - 텍스트 정렬 (왼쪽/가운데/오른쪽/양쪽)
 * - 변수 플레이스홀더 삽입 ({제출자_이름} 등)
 *
 * @relatedFiles
 * - EmailEditorToolbar.tsx - 에디터 툴바 컴포넌트
 * - lib/tiptap/extensions.ts - TipTap 확장 설정
 * - lib/tiptap/html-utils.ts - HTML 변환 유틸리티
 * - EmailPreviewEditable.tsx - SendForm용 미리보기 (이 에디터 사용)
 * - ShareEmailPreviewEditable.tsx - ShareForm용 미리보기 (이 에디터 사용)
 *
 * @knownIssues
 * 이 파일에서 해결된 주요 이슈들:
 * 1. 툴바 버튼 클릭 시 툴바가 사라지는 문제 (handleBlur에서 해결)
 * 2. SSR 하이드레이션 오류 (immediatelyRender: false로 해결)
 *
 * @unresolvedIssues
 * [미해결] 한글 IME 입력 시 마지막 글자 사라짐 (Chrome 128+, Mac)
 * - 증상: '가나다' 입력 후 커서 이동 없이 Enter → '가나'만 남음
 * - 원인: compositionend 직후 마지막 글자가 선택 상태가 되는 Chrome 버그
 * - 시도한 방법들:
 *   1. composingRef로 조합 상태 추적 + setTimeout 지연 (50ms/60ms/100ms)
 *   2. event.isComposing || view.composing || composingRef 체크
 *   3. 공백 문자 트릭 (공백 삽입 → 조합 강제 종료 → 공백 삭제 → 줄바꿈)
 *   4. requestAnimationFrame으로 타이밍 동기화
 * - 참고: ProseMirror Issue #1484
 */

import { useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { getEmailEditorExtensions } from '@/lib/tiptap/extensions';
import { EmailEditorToolbar } from './EmailEditorToolbar';

// ============================================================================
// 타입 정의
// ============================================================================

interface EmailEditorProps {
    /** 에디터 내용 (HTML 문자열) */
    content: string;
    /** 내용 변경 시 호출되는 콜백 */
    onChange: (html: string) => void;
    /** 에디터가 비어있을 때 표시되는 텍스트 */
    placeholder?: string;
    /** true면 편집 불가능한 읽기 전용 모드 */
    readOnly?: boolean;
    /** 에디터의 최소 높이 (CSS 값) */
    minHeight?: string;
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export function EmailEditor({
    content,
    onChange,
    placeholder = '내용을 입력하세요...',
    readOnly = false,
    minHeight = '80px',
}: EmailEditorProps) {
    // 에디터 포커스 상태 (툴바 표시 여부 결정)
    const [isFocused, setIsFocused] = useState(false);

    // 에디터 전체 컨테이너 ref (툴바 + 에디터 영역 포함)
    // blur 이벤트에서 포커스 이동 대상이 컨테이너 내부인지 확인하는 데 사용
    const containerRef = useRef<HTMLDivElement>(null);

    /**
     * ========================================================================
     * [문제 해결] 툴바 버튼 클릭 시 툴바가 사라지는 문제
     * ========================================================================
     *
     * @problem
     * 에디터의 onBlur가 발생하면 isFocused가 false가 되어 툴바가 사라짐.
     * 툴바 버튼이나 드롭다운 메뉴를 클릭하면 에디터에서 포커스가 빠지면서
     * onBlur가 발생하여 툴바가 사라지고, 결과적으로 서식이 적용되지 않음.
     *
     * @additionalProblem
     * Radix UI 드롭다운(형광펜 색상 선택 등)은 React Portal로 body에 렌더링됨.
     * 따라서 containerRef.contains()가 항상 false를 반환하여
     * 드롭다운 클릭 시 포커스 유지가 안됨.
     *
     * @solution
     * 1. relatedTarget(포커스가 이동하는 대상)이 에디터 컨테이너 내부인지 확인
     * 2. Radix UI Portal 요소(data-radix-* 속성)로 이동하는 경우 감지
     * 3. setTimeout(100ms)으로 blur 처리를 지연시켜, 드롭다운 닫힌 후
     *    에디터로 포커스가 돌아오면 isFocused 유지
     */
    const handleBlur = useCallback(
        (blurEvent: { event: FocusEvent }) => {
            const relatedTarget = blurEvent.event.relatedTarget as Node | null;

            // Case 1: relatedTarget이 에디터 컨테이너 내부에 있으면 포커스 유지
            if (
                relatedTarget &&
                containerRef.current?.contains(relatedTarget)
            ) {
                return;
            }

            // Case 2: Radix UI Portal 요소(드롭다운 메뉴 등)로 포커스가 이동하는 경우
            if (relatedTarget instanceof HTMLElement) {
                // Radix UI 컴포넌트는 data-radix-* 속성을 가짐
                const isRadixPortal =
                    relatedTarget.closest('[data-radix-popper-content-wrapper]') ||
                    relatedTarget.closest('[data-radix-menu-content]') ||
                    relatedTarget.closest('[role="menu"]');
                if (isRadixPortal) {
                    return; // 드롭다운 메뉴 클릭 시에는 isFocused 유지
                }
            }

            // Case 3: setTimeout으로 지연시켜 드롭다운 닫힌 후 에디터 포커스 확인
            // 드롭다운이 닫히면서 에디터로 포커스가 돌아오는 경우를 처리
            setTimeout(() => {
                const activeElement = document.activeElement;
                if (
                    activeElement &&
                    containerRef.current?.contains(activeElement)
                ) {
                    return; // 에디터 내부에 포커스가 있으면 유지
                }
                setIsFocused(false);
            }, 100);
        },
        []
    );

    // TipTap 에디터 인스턴스 생성
    const editor = useEditor({
        extensions: getEmailEditorExtensions(placeholder),
        content,
        editable: !readOnly,
        /**
         * [문제 해결] SSR 하이드레이션 오류
         *
         * @problem
         * Next.js SSR에서 서버/클라이언트 HTML 불일치로 하이드레이션 오류 발생.
         * TipTap이 서버에서 다른 HTML을 생성하기 때문.
         *
         * @solution
         * immediatelyRender: false로 설정하여 클라이언트에서만 렌더링
         */
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        onFocus: () => setIsFocused(true),
        onBlur: handleBlur,
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none',
                style: `min-height: ${minHeight}`,
            },
        },
    });

    // 에디터 로딩 중 표시
    if (!editor) {
        return (
            <div
                className="animate-pulse bg-gray-100 rounded"
                style={{ minHeight }}
            />
        );
    }

    return (
        <div ref={containerRef} className="email-editor">
            {/* 포커스된 에디터에만 툴바 표시 */}
            {!readOnly && isFocused && <EmailEditorToolbar editor={editor} />}

            {/* 에디터 본문 영역 */}
            <div
                className={`rounded-lg p-3 border ${
                    readOnly
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-white border-gray-300 focus-within:border-blue-500'
                }`}
            >
                <EditorContent editor={editor} />
            </div>

            {/*
             * ================================================================
             * TipTap 에디터 CSS 스타일
             * ================================================================
             *
             * ProseMirror는 기본 스타일이 없으므로 직접 정의해야 함.
             * 특히 list-style-type이 없으면 불렛/숫자가 표시되지 않음.
             *
             * @relatedFiles
             * - EmailPreviewEditable.tsx의 .email-preview-content 스타일과 동일하게 유지
             * - ShareEmailPreviewEditable.tsx의 .email-preview-content 스타일과 동일하게 유지
             * - lib/tiptap/html-utils.ts의 sanitizeHtmlForEmail()과 스타일 일관성 유지
             */}
            <style jsx global>{`
                /* 기본 에디터 스타일 */
                .email-editor .ProseMirror {
                    outline: none;
                }
                .email-editor .ProseMirror p {
                    margin: 0 0 8px 0;
                }
                .email-editor .ProseMirror p:last-child {
                    margin-bottom: 0;
                }

                /* 플레이스홀더 스타일 */
                .email-editor .ProseMirror.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #9ca3af;
                    pointer-events: none;
                    height: 0;
                }

                /*
                 * [문제 해결] BulletList/OrderedList가 표시되지 않는 문제
                 *
                 * @problem
                 * 툴바에서 리스트 버튼을 클릭해도 불렛/숫자가 보이지 않음.
                 * ProseMirror 기본 스타일에 list-style-type이 없기 때문.
                 *
                 * @solution
                 * list-style-type: disc/decimal 명시적 지정
                 */
                .email-editor .ProseMirror ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                    margin: 0 0 8px 0;
                }
                .email-editor .ProseMirror ol {
                    list-style-type: decimal;
                    padding-left: 1.5rem;
                    margin: 0 0 8px 0;
                }
                .email-editor .ProseMirror li {
                    margin-bottom: 4px;
                }
                .email-editor .ProseMirror li p {
                    margin: 0;
                }
                .email-editor .ProseMirror li:last-child {
                    margin-bottom: 0;
                }

                /* 인용(Blockquote) 스타일 */
                .email-editor .ProseMirror blockquote {
                    border-left: 3px solid #d1d5db;
                    padding-left: 1rem;
                    margin: 0 0 8px 0;
                    color: #6b7280;
                    font-style: italic;
                }

                /* Heading 스타일 (H1~H4) */
                .email-editor .ProseMirror h1 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    line-height: 1.3;
                    margin: 0 0 12px 0;
                    color: #111827;
                }
                .email-editor .ProseMirror h2 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    line-height: 1.3;
                    margin: 0 0 10px 0;
                    color: #1f2937;
                }
                .email-editor .ProseMirror h3 {
                    font-size: 1.125rem;
                    font-weight: 600;
                    line-height: 1.4;
                    margin: 0 0 8px 0;
                    color: #374151;
                }
                .email-editor .ProseMirror h4 {
                    font-size: 1rem;
                    font-weight: 600;
                    line-height: 1.4;
                    margin: 0 0 6px 0;
                    color: #4b5563;
                }

                /* 형광펜(Highlight) 스타일 - 기본 노란색 */
                .email-editor .ProseMirror mark {
                    background-color: #fef08a;
                    padding: 0.125rem 0.25rem;
                    border-radius: 0.125rem;
                }

                /* 링크(Link) 스타일 */
                .email-editor .ProseMirror a {
                    color: #2563eb;
                    text-decoration: underline;
                    cursor: pointer;
                }
                .email-editor .ProseMirror a:hover {
                    color: #1d4ed8;
                }
            `}</style>
        </div>
    );
}
