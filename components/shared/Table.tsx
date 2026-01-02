import { ReactNode } from 'react';

/**
 * 테이블 컬럼 정의
 */
export interface Column<T> {
    /** 컬럼 식별자 */
    key: string;
    /** 헤더 콘텐츠 */
    header: ReactNode;
    /** 셀 렌더링 함수 */
    render: (item: T, index: number) => ReactNode;
    /** 헤더 추가 클래스 */
    headerClassName?: string;
    /** 셀 추가 클래스 */
    cellClassName?: string;
}

interface TableProps<T> {
    /** 컬럼 정의 배열 */
    columns: Column<T>[];
    /** 테이블 데이터 */
    data: T[];
    /** 각 행의 고유 키 추출 함수 */
    keyExtractor: (item: T) => string;
    /** 데이터가 없을 때 표시할 메시지 */
    emptyMessage?: string;
}

/**
 * 재사용 가능한 테이블 컴포넌트
 * 컬럼 기반 설계로 다양한 데이터 타입에 대응
 */
export function Table<T>({
    columns,
    data,
    keyExtractor,
    emptyMessage = '데이터가 없습니다.',
}: TableProps<T>) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-200">
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={`text-left py-3 px-4 text-xs font-medium text-gray-500 ${column.headerClassName ?? ''}`}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length > 0 ? (
                        data.map((item, index) => (
                            <tr
                                key={keyExtractor(item)}
                                className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                            >
                                {columns.map((column) => (
                                    <td
                                        key={column.key}
                                        className={`py-3 px-4 ${column.cellClassName ?? ''}`}
                                    >
                                        {column.render(item, index)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="py-8 text-center text-sm text-gray-500"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
