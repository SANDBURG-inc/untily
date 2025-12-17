"use client"

import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"
import { Table, type Column } from "@/components/shared/Table"
import { PageHeader } from "@/components/shared/PageHeader"
import { IconButton } from "@/components/shared/IconButton"
import { Plus, Edit } from "lucide-react"

// 예시 데이터 타입
interface ExampleUser {
  id: string
  name: string
  email: string
  status: "active" | "pending"
}

const exampleUsers: ExampleUser[] = [
  { id: "1", name: "홍길동", email: "hong@example.com", status: "active" },
  { id: "2", name: "김철수", email: "kim@example.com", status: "pending" },
  { id: "3", name: "이영희", email: "lee@example.com", status: "active" },
]

const userColumns: Column<ExampleUser>[] = [
  {
    key: "name",
    header: "이름",
    render: (user) => <span className="font-medium">{user.name}</span>,
  },
  {
    key: "email",
    header: "이메일",
    render: (user) => user.email,
  },
  {
    key: "status",
    header: "상태",
    render: (user) => (
      <span
        className={`px-2 py-1 rounded-full text-xs ${
          user.status === "active"
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
        }`}
      >
        {user.status === "active" ? "활성" : "대기"}
      </span>
    ),
  },
]

export function CustomComponentSection() {
  return (
    <ComponentShowcase
      id="custom-components"
      title="커스텀 컴포넌트"
      description="프로젝트에서 재사용되는 공용 컴포넌트입니다. @/components/shared 디렉토리에 위치합니다."
    >
      <div className="flex flex-col gap-10 w-full">
        {/* PageHeader */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            PageHeader
          </h3>
          <p className="text-sm text-muted-foreground">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
              @/components/shared/PageHeader
            </code>
            {" "}- 페이지 제목과 설명을 표준화된 스타일로 표시. 좌측 정렬(액션 버튼 포함) 또는 중앙 정렬 지원.
          </p>

          <div className="space-y-6 border rounded-lg p-6 bg-background">
            <div>
              <p className="text-xs text-muted-foreground mb-3">align=&quot;left&quot; (기본값) + actions</p>
              <PageHeader
                title="문서함 목록"
                description="등록된 문서함을 관리합니다."
                actions={
                  <IconButton icon={<Plus className="h-4 w-4" />} variant="primary" size="sm">
                    새 문서함
                  </IconButton>
                }
              />
            </div>

            <hr className="border-border/40" />

            <div>
              <p className="text-xs text-muted-foreground mb-3">align=&quot;center&quot;</p>
              <PageHeader
                title="서류 제출"
                description="요청받은 서류를 제출해주세요."
                align="center"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Table
          </h3>
          <p className="text-sm text-muted-foreground">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
              @/components/shared/Table
            </code>
            {" "}- 제네릭 테이블 컴포넌트. 컬럼 기반 설계로 다양한 데이터 타입에 대응.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Table
              columns={userColumns}
              data={exampleUsers}
              keyExtractor={(user) => user.id}
            />
          </div>

          <div className="border rounded-lg overflow-hidden">
            <p className="text-xs text-muted-foreground p-4 border-b">빈 상태 (emptyMessage)</p>
            <Table
              columns={userColumns}
              data={[]}
              keyExtractor={(user) => user.id}
              emptyMessage="등록된 사용자가 없습니다."
            />
          </div>
        </div>
      </div>
    </ComponentShowcase>
  )
}
