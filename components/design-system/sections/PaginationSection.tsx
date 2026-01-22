"use client"

import { useState } from "react"
import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"
import { Pagination } from "@/components/shared/Pagination"

export function PaginationSection() {
  // 인터랙티브 데모를 위한 상태
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 5

  return (
    <ComponentShowcase
      id="pagination"
      title="Pagination"
      description="목록 페이지에서 사용하는 이전/다음 페이지 네비게이션 컴포넌트입니다. Server Component에서 사용 가능하며, Link 기반으로 동작합니다. components/shared/Pagination.tsx"
    >
      <div className="flex flex-col gap-8 w-full">
        {/* 기본 사용법 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            기본 사용법
          </h3>
          <p className="text-sm text-muted-foreground">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">currentPage</code>,{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">totalPages</code>,{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">createPageUrl</code>을 전달합니다.
          </p>
          <div className="border rounded-lg p-4 bg-white">
            <Pagination
              currentPage={2}
              totalPages={10}
              createPageUrl={(page) => `#page=${page}`}
            />
          </div>
          <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
{`<Pagination
  currentPage={2}
  totalPages={10}
  createPageUrl={(page) => \`/items?page=\${page}\`}
/>`}
          </pre>
        </div>

        {/* 인터랙티브 데모 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            인터랙티브 데모
          </h3>
          <p className="text-sm text-muted-foreground">
            버튼을 클릭하여 페이지 이동을 테스트해보세요. (데모용으로 클릭 이벤트 사용)
          </p>
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mt-4 px-2">
              <span className="text-sm text-gray-500">
                {currentPage} / {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border border-slate-200 rounded-md bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 첫 페이지 / 마지막 페이지 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            경계 상태 (첫 페이지 / 마지막 페이지)
          </h3>
          <p className="text-sm text-muted-foreground">
            첫 페이지에서는 이전 버튼이, 마지막 페이지에서는 다음 버튼이 비활성화됩니다.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 bg-white">
              <p className="text-xs text-muted-foreground mb-2">첫 페이지</p>
              <Pagination
                currentPage={1}
                totalPages={5}
                createPageUrl={(page) => `#page=${page}`}
              />
            </div>
            <div className="border rounded-lg p-4 bg-white">
              <p className="text-xs text-muted-foreground mb-2">마지막 페이지</p>
              <Pagination
                currentPage={5}
                totalPages={5}
                createPageUrl={(page) => `#page=${page}`}
              />
            </div>
          </div>
        </div>

        {/* 페이지 정보 숨김 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            페이지 정보 숨김
          </h3>
          <p className="text-sm text-muted-foreground">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">showPageInfo=false</code>로
            페이지 정보(1/10)를 숨길 수 있습니다.
          </p>
          <div className="border rounded-lg p-4 bg-white">
            <Pagination
              currentPage={3}
              totalPages={10}
              createPageUrl={(page) => `#page=${page}`}
              showPageInfo={false}
            />
          </div>
        </div>

        {/* 커스텀 레이블 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            커스텀 레이블
          </h3>
          <p className="text-sm text-muted-foreground">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">prevLabel</code>,{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">nextLabel</code>로
            버튼 텍스트를 변경할 수 있습니다.
          </p>
          <div className="border rounded-lg p-4 bg-white">
            <Pagination
              currentPage={2}
              totalPages={5}
              createPageUrl={(page) => `#page=${page}`}
              prevLabel="← Previous"
              nextLabel="Next →"
            />
          </div>
        </div>

        {/* Props 정리 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Props
          </h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Prop</th>
                  <th className="text-left p-3 font-medium">타입</th>
                  <th className="text-left p-3 font-medium">필수</th>
                  <th className="text-left p-3 font-medium">설명</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3"><code className="bg-muted px-1.5 py-0.5 rounded text-xs">currentPage</code></td>
                  <td className="p-3 text-muted-foreground">number</td>
                  <td className="p-3">✓</td>
                  <td className="p-3 text-muted-foreground">현재 페이지 (1부터 시작)</td>
                </tr>
                <tr>
                  <td className="p-3"><code className="bg-muted px-1.5 py-0.5 rounded text-xs">totalPages</code></td>
                  <td className="p-3 text-muted-foreground">number</td>
                  <td className="p-3">✓</td>
                  <td className="p-3 text-muted-foreground">총 페이지 수</td>
                </tr>
                <tr>
                  <td className="p-3"><code className="bg-muted px-1.5 py-0.5 rounded text-xs">createPageUrl</code></td>
                  <td className="p-3 text-muted-foreground">(page: number) =&gt; string</td>
                  <td className="p-3">✓</td>
                  <td className="p-3 text-muted-foreground">페이지 URL 생성 함수</td>
                </tr>
                <tr>
                  <td className="p-3"><code className="bg-muted px-1.5 py-0.5 rounded text-xs">showPageInfo</code></td>
                  <td className="p-3 text-muted-foreground">boolean</td>
                  <td className="p-3"></td>
                  <td className="p-3 text-muted-foreground">페이지 정보 표시 (기본: true)</td>
                </tr>
                <tr>
                  <td className="p-3"><code className="bg-muted px-1.5 py-0.5 rounded text-xs">prevLabel</code></td>
                  <td className="p-3 text-muted-foreground">string</td>
                  <td className="p-3"></td>
                  <td className="p-3 text-muted-foreground">이전 버튼 텍스트 (기본: &apos;이전&apos;)</td>
                </tr>
                <tr>
                  <td className="p-3"><code className="bg-muted px-1.5 py-0.5 rounded text-xs">nextLabel</code></td>
                  <td className="p-3 text-muted-foreground">string</td>
                  <td className="p-3"></td>
                  <td className="p-3 text-muted-foreground">다음 버튼 텍스트 (기본: &apos;다음&apos;)</td>
                </tr>
                <tr>
                  <td className="p-3"><code className="bg-muted px-1.5 py-0.5 rounded text-xs">className</code></td>
                  <td className="p-3 text-muted-foreground">string</td>
                  <td className="p-3"></td>
                  <td className="p-3 text-muted-foreground">추가 CSS 클래스</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ComponentShowcase>
  )
}
