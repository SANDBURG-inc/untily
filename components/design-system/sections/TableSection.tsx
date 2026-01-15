"use client"

import { ComponentShowcase } from "@/components/design-system/ComponentShowcase"
import { Table, type Column } from "@/components/shared/Table"

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

export function TableSection() {
  return (
    <ComponentShowcase
      id="table"
      title="Table"
      description="제네릭 테이블 컴포넌트입니다. 컬럼 기반 설계로 다양한 데이터 타입에 대응합니다. components/shared/Table.tsx"
    >
      <div className="flex flex-col gap-8 w-full">
        {/* 기본 테이블 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            기본 사용법
          </h3>
          <p className="text-sm text-muted-foreground">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">columns</code>,{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">data</code>,{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">keyExtractor</code>를 전달합니다.
          </p>
          <div className="border rounded-lg overflow-hidden">
            <Table
              columns={userColumns}
              data={exampleUsers}
              keyExtractor={(user) => user.id}
            />
          </div>
        </div>

        {/* 빈 상태 */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            빈 상태 (Empty State)
          </h3>
          <p className="text-sm text-muted-foreground">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">emptyMessage</code>로 빈 상태 메시지를 커스텀할 수 있습니다.
          </p>
          <div className="border rounded-lg overflow-hidden">
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
