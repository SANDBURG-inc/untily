'use client';

/**
 * ============================================================================
 * 이메일 에디터 툴바 컴포넌트
 * ============================================================================
 *
 * @description
 * TipTap 에디터의 서식 도구를 제공하는 툴바입니다.
 * Bold, Italic, 형광펜, 리스트, 정렬, 링크, 변수 삽입 등의 기능을 제공합니다.
 *
 * @features
 * - 텍스트 서식: Bold, Italic, Highlight(멀티컬러)
 * - 리스트: BulletList, OrderedList
 * - 블록: Blockquote
 * - 정렬: 왼쪽, 가운데, 오른쪽, 양쪽
 * - 링크: 추가/제거
 * - 변수: 플레이스홀더 삽입 ({제출자_이름} 등)
 *
 * @relatedFiles
 * - EmailEditor.tsx - 이 툴바를 사용하는 메인 에디터
 * - lib/tiptap/extensions.ts - TipTap 확장 설정 (Highlight multicolor 등)
 * - lib/tiptap/html-utils.ts - PLACEHOLDERS 상수 정의
 *
 * @knownIssues
 * 이 파일에서 해결된 주요 이슈들:
 * 1. 툴바 버튼 클릭 시 에디터 포커스 유실 (onMouseDown preventDefault로 해결)
 * 2. 하이라이트 사용 후 버튼이 계속 활성화 상태 (storedMarks 초기화로 해결)
 */

import { useCallback, useEffect, useReducer } from 'react';
import type { Editor } from '@tiptap/react';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    User,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Quote,
    Link2,
    Highlighter,
    Ban,
    ChevronDown,
    Type,
    ALargeSmall,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    Pilcrow,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { PLACEHOLDERS } from '@/lib/tiptap/html-utils';
import { cn } from '@/lib/utils';

// ============================================================================
// 상수 정의
// ============================================================================

/**
 * 형광펜 색상 팔레트
 *
 * @note
 * 이 색상들은 lib/tiptap/html-utils.ts의 sanitizeHtmlForEmail()에서
 * 이메일 발송 시 인라인 스타일로 변환됨.
 * 색상 추가/변경 시 sanitizeHtmlForEmail()도 함께 확인 필요.
 */
const HIGHLIGHT_COLORS = [
    { color: '#bbf7d0', label: '녹색' },
    { color: '#bfdbfe', label: '파란색' },
    { color: '#fbcfe8', label: '분홍색' },
    { color: '#ddd6fe', label: '보라색' },
    { color: '#fef08a', label: '노란색' },
] as const;

/**
 * 텍스트 색상 팔레트
 * 블루톤 테마 + 기본 색상
 */
const TEXT_COLORS = [
    { color: '#1f2937', label: '검정' },
    { color: '#6b7280', label: '회색' },
    { color: '#2563eb', label: '파랑' },
    { color: '#059669', label: '초록' },
    { color: '#7c3aed', label: '보라' },
    { color: '#dc2626', label: '빨강' },
    { color: '#ea580c', label: '주황' },
] as const;

/**
 * 글자 크기 옵션
 * 기본/작게/크게/더크게
 */
const FONT_SIZES = [
    { size: '12px', label: '작게' },
    { size: '14px', label: '기본' },
    { size: '16px', label: '크게' },
    { size: '18px', label: '더 크게' },
] as const;

// ============================================================================
// 타입 정의
// ============================================================================

interface EmailEditorToolbarProps {
    /** TipTap 에디터 인스턴스 */
    editor: Editor;
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export function EmailEditorToolbar({ editor }: EmailEditorToolbarProps) {
    /**
     * ========================================================================
     * [문제 해결] 커서 위치에 따른 툴바 상태 동기화
     * ========================================================================
     *
     * @problem
     * React는 `editor` 객체 참조가 동일하면 리렌더링하지 않음.
     * 결과적으로 커서를 이동해도 `editor.isActive()` 결과가 UI에 반영되지 않아
     * 정렬, 볼드 등의 버튼 활성화 상태가 이전 값으로 유지됨.
     *
     * @solution
     * 에디터의 `selectionUpdate`/`update` 이벤트를 구독하여
     * 커서 이동이나 내용 변경 시 컴포넌트를 강제 리렌더링.
     */
    const [, forceUpdate] = useReducer((x) => x + 1, 0);

    useEffect(() => {
        const handleUpdate = () => forceUpdate();

        // 커서/선택 영역 변경 시 리렌더링
        editor.on('selectionUpdate', handleUpdate);
        // 내용 변경 시에도 리렌더링 (서식 적용 반영)
        editor.on('update', handleUpdate);

        return () => {
            editor.off('selectionUpdate', handleUpdate);
            editor.off('update', handleUpdate);
        };
    }, [editor]);

    // 플레이스홀더 삽입 (변수 버튼)
    const insertPlaceholder = (placeholder: string) => {
        editor.chain().focus().insertContent(placeholder).run();
    };

    // 링크 추가/제거
    const toggleLink = useCallback(() => {
        if (editor.isActive('link')) {
            editor.chain().focus().unsetLink().run();
            return;
        }

        const url = window.prompt('링크 URL을 입력하세요:');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    }, [editor]);

    /**
     * ========================================================================
     * [문제 해결] 하이라이트 색상 적용 후 storedMarks 초기화
     * ========================================================================
     *
     * @problem
     * 하이라이트를 한번 사용하면, 커서가 하이라이트되지 않은 텍스트에 있어도
     * 툴바의 하이라이트 버튼이 활성화(하늘색 배경) 상태로 표시됨.
     *
     * @cause
     * TipTap은 서식을 적용하면 storedMarks에 해당 마크를 저장함.
     * 이는 다음 입력에도 같은 서식을 적용하기 위함.
     * editor.isActive('highlight')는 storedMarks도 확인하므로,
     * 실제 텍스트에 하이라이트가 없어도 true를 반환할 수 있음.
     *
     * @solution
     * 색상 적용 후 storedMarks에서 highlight 마크를 제거.
     * 이렇게 하면 다음 입력에 자동으로 하이라이트가 적용되지 않고,
     * isActive도 실제 텍스트의 하이라이트 여부만 확인함.
     */
    const applyHighlight = useCallback(
        (color: string) => {
            // 1. 선택된 텍스트에 하이라이트 적용
            editor.chain().focus().setHighlight({ color }).run();

            // 2. storedMarks에서 highlight 제거 (다음 입력에 자동 적용 방지)
            // setTimeout으로 다음 틱에서 실행해야 적용됨
            setTimeout(() => {
                const { state, view } = editor;
                if (state.storedMarks) {
                    const newStoredMarks = state.storedMarks.filter(
                        (mark) => mark.type.name !== 'highlight'
                    );
                    view.dispatch(state.tr.setStoredMarks(newStoredMarks));
                }
            }, 0);
        },
        [editor]
    );

    return (
        <div className="flex items-center gap-1 mb-2 p-1 bg-gray-50 border border-gray-200 rounded-lg flex-wrap">
            {/* ============================================================
                Heading 드롭다운 (# + Space로 입력 가능)
                ============================================================ */}
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                className={cn(
                                    'flex items-center gap-0.5 p-1.5 rounded transition-colors',
                                    editor.isActive('heading')
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-200'
                                )}
                            >
                                <Pilcrow className="w-4 h-4" />
                                <ChevronDown className="w-3 h-3" />
                            </button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>단락/제목</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="min-w-[140px]">
                    <DropdownMenuItem
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().setParagraph().run()}
                        className={cn(
                            'cursor-pointer',
                            !editor.isActive('heading') && 'bg-blue-50'
                        )}
                    >
                        <Pilcrow className="w-4 h-4 mr-2" />
                        <span>본문</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={cn(
                            'cursor-pointer',
                            editor.isActive('heading', { level: 1 }) && 'bg-blue-50'
                        )}
                    >
                        <Heading1 className="w-4 h-4 mr-2" />
                        <span className="text-xl font-bold">제목 1</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={cn(
                            'cursor-pointer',
                            editor.isActive('heading', { level: 2 }) && 'bg-blue-50'
                        )}
                    >
                        <Heading2 className="w-4 h-4 mr-2" />
                        <span className="text-lg font-bold">제목 2</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={cn(
                            'cursor-pointer',
                            editor.isActive('heading', { level: 3 }) && 'bg-blue-50'
                        )}
                    >
                        <Heading3 className="w-4 h-4 mr-2" />
                        <span className="text-base font-semibold">제목 3</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                        className={cn(
                            'cursor-pointer',
                            editor.isActive('heading', { level: 4 }) && 'bg-blue-50'
                        )}
                    >
                        <Heading4 className="w-4 h-4 mr-2" />
                        <span className="text-sm font-semibold">제목 4</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Divider />

            {/* ============================================================
                텍스트 서식 버튼들
                ============================================================ */}

            {/* 굵게 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                tooltip="굵게 (Ctrl+B)"
            >
                <Bold className="w-4 h-4" />
            </ToolbarButton>

            {/* 기울임 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                tooltip="기울임 (Ctrl+I)"
            >
                <Italic className="w-4 h-4" />
            </ToolbarButton>

            {/*
             * ============================================================
             * 형광펜 색상 선택 드롭다운
             * ============================================================
             *
             * @note
             * Radix UI DropdownMenu는 Portal로 body에 렌더링됨.
             * 따라서 EmailEditor.tsx의 handleBlur에서 특별 처리 필요.
             * (data-radix-* 속성으로 감지)
             */}
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                /**
                                 * [문제 해결] 버튼 클릭 시 에디터 포커스 유실 방지
                                 *
                                 * @problem
                                 * 버튼 클릭 시 에디터에서 포커스가 버튼으로 이동하면서
                                 * onBlur가 발생하고 툴바가 사라짐.
                                 *
                                 * @solution
                                 * onMouseDown에서 preventDefault()를 호출하면
                                 * 클릭해도 포커스가 이동하지 않음.
                                 */
                                onMouseDown={(e) => e.preventDefault()}
                                className={cn(
                                    'flex items-center gap-0.5 p-1.5 rounded transition-colors',
                                    editor.isActive('highlight')
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-200'
                                )}
                            >
                                <Highlighter className="w-4 h-4" />
                                <ChevronDown className="w-3 h-3" />
                            </button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>형광펜 색상</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="p-2 min-w-0">
                    <div className="flex items-center gap-1">
                        {HIGHLIGHT_COLORS.map((item) => (
                            <Tooltip key={item.color}>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => applyHighlight(item.color)}
                                        className={cn(
                                            'w-6 h-6 rounded-full border-2 transition-all hover:scale-110',
                                            editor.isActive('highlight', { color: item.color })
                                                ? 'border-gray-800'
                                                : 'border-transparent hover:border-gray-300'
                                        )}
                                        style={{ backgroundColor: item.color }}
                                    />
                                </TooltipTrigger>
                                <TooltipContent>{item.label}</TooltipContent>
                            </Tooltip>
                        ))}
                        {/* 형광펜 제거 버튼 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        editor.chain().focus().unsetHighlight().run();
                                    }}
                                    className="w-6 h-6 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all hover:scale-110"
                                >
                                    <Ban className="w-3.5 h-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>형광펜 제거</TooltipContent>
                        </Tooltip>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* ============================================================
                텍스트 색상 선택 드롭다운
                ============================================================ */}
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                className={cn(
                                    'flex items-center gap-0.5 p-1.5 rounded transition-colors',
                                    editor.isActive('textStyle')
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-200'
                                )}
                            >
                                <Type className="w-4 h-4" />
                                <ChevronDown className="w-3 h-3" />
                            </button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>텍스트 색상</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="p-2 min-w-0">
                    <div className="flex items-center gap-1">
                        {TEXT_COLORS.map((item) => (
                            <Tooltip key={item.color}>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            editor.chain().focus().setColor(item.color).run();
                                        }}
                                        className={cn(
                                            'w-6 h-6 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center',
                                            editor.isActive('textStyle', { color: item.color })
                                                ? 'border-gray-800'
                                                : 'border-transparent hover:border-gray-300'
                                        )}
                                        style={{ backgroundColor: item.color }}
                                    >
                                        <span className="text-white text-xs font-bold drop-shadow-sm">A</span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>{item.label}</TooltipContent>
                            </Tooltip>
                        ))}
                        {/* 색상 제거 버튼 */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        editor.chain().focus().unsetColor().run();
                                    }}
                                    className="w-6 h-6 rounded-full border-2 border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all hover:scale-110"
                                >
                                    <Ban className="w-3.5 h-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>색상 제거</TooltipContent>
                        </Tooltip>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* ============================================================
                글자 크기 선택 드롭다운
                ============================================================ */}
            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                className="flex items-center gap-0.5 p-1.5 rounded transition-colors text-gray-600 hover:bg-gray-200"
                            >
                                <ALargeSmall className="w-4 h-4" />
                                <ChevronDown className="w-3 h-3" />
                            </button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>글자 크기</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="min-w-[100px]">
                    {FONT_SIZES.map((item) => (
                        <DropdownMenuItem
                            key={item.size}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                                editor.chain().focus().setMark('textStyle', { fontSize: item.size }).run();
                            }}
                            className="cursor-pointer"
                        >
                            <span style={{ fontSize: item.size }}>{item.label}</span>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                            editor.chain().focus().unsetMark('textStyle').run();
                        }}
                        className="cursor-pointer text-gray-500"
                    >
                        크기 초기화
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Divider />

            {/* ============================================================
                리스트 버튼들
                ============================================================ */}

            {/* 글머리 기호 목록 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                tooltip="글머리 기호 목록"
            >
                <List className="w-4 h-4" />
            </ToolbarButton>

            {/* 번호 매기기 목록 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                tooltip="번호 매기기 목록"
            >
                <ListOrdered className="w-4 h-4" />
            </ToolbarButton>

            {/* 인용 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                tooltip="인용"
            >
                <Quote className="w-4 h-4" />
            </ToolbarButton>

            <Divider />

            {/* ============================================================
                정렬 버튼들
                ============================================================ */}

            {/* 왼쪽 정렬 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({ textAlign: 'left' })}
                tooltip="왼쪽 정렬"
            >
                <AlignLeft className="w-4 h-4" />
            </ToolbarButton>

            {/* 가운데 정렬 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({ textAlign: 'center' })}
                tooltip="가운데 정렬"
            >
                <AlignCenter className="w-4 h-4" />
            </ToolbarButton>

            {/* 오른쪽 정렬 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({ textAlign: 'right' })}
                tooltip="오른쪽 정렬"
            >
                <AlignRight className="w-4 h-4" />
            </ToolbarButton>

            {/* 양쪽 정렬 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                isActive={editor.isActive({ textAlign: 'justify' })}
                tooltip="양쪽 정렬"
            >
                <AlignJustify className="w-4 h-4" />
            </ToolbarButton>

            <Divider />

            {/* ============================================================
                링크 버튼
                ============================================================ */}

            <ToolbarButton
                onClick={toggleLink}
                isActive={editor.isActive('link')}
                tooltip="링크 추가/제거"
            >
                <Link2 className="w-4 h-4" />
            </ToolbarButton>

            <Divider />

            {/* ============================================================
                변수 삽입 드롭다운
                ============================================================ */}

            <DropdownMenu>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 rounded transition-colors"
                            >
                                <User className="w-3.5 h-3.5" />
                                <span>변수</span>
                            </button>
                        </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>변수 삽입</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="min-w-[160px]">
                    {PLACEHOLDERS.map((item) => (
                        <DropdownMenuItem
                            key={item.id}
                            onClick={() => insertPlaceholder(item.placeholder)}
                        >
                            <span className="font-mono text-blue-600 mr-2">
                                {item.placeholder}
                            </span>
                            <span className="text-gray-500">{item.label}</span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

// ============================================================================
// 서브 컴포넌트
// ============================================================================

/** 툴바 구분선 */
function Divider() {
    return <div className="w-px h-5 bg-gray-300 mx-1" />;
}

/**
 * 툴바 버튼 컴포넌트 (Tooltip 포함)
 *
 * @note
 * onMouseDown에서 preventDefault()를 호출하여
 * 버튼 클릭 시 에디터 포커스가 유지되도록 함.
 * 이것이 없으면 버튼 클릭 시 툴바가 사라짐.
 */
interface ToolbarButtonProps {
    onClick: () => void;
    isActive?: boolean;
    tooltip: string;
    children: React.ReactNode;
}

function ToolbarButton({
    onClick,
    isActive,
    tooltip,
    children,
}: ToolbarButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={onClick}
                    /**
                     * [중요] 포커스 유실 방지
                     * preventDefault()로 기본 포커스 이동을 막음
                     */
                    onMouseDown={(e) => e.preventDefault()}
                    className={cn(
                        'p-1.5 rounded transition-colors',
                        isActive
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-200'
                    )}
                >
                    {children}
                </button>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
    );
}
