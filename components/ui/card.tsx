/**
 * Card 컴포넌트 (shadcn/ui 기반)
 *
 * 카드 레이아웃을 위한 기본 컴포넌트입니다.
 *
 * ## 섹션 타이틀 스타일 통일
 * 카드 내 섹션 타이틀에는 `@/components/shared/SectionHeader`를 사용하세요.
 * 일관된 아이콘 + 타이틀 스타일을 제공합니다.
 *
 * @example
 * ```tsx
 * import { SectionHeader } from '@/components/shared/SectionHeader';
 * import { FileText } from 'lucide-react';
 *
 * <Card>
 *   <CardHeader>
 *     <CardTitle>
 *       <SectionHeader icon={FileText} title="수집 서류 목록" />
 *     </CardTitle>
 *     <CardAction>
 *       <Button>액션 버튼</Button>
 *     </CardAction>
 *   </CardHeader>
 *   <CardContent>...</CardContent>
 * </Card>
 * ```
 *
 * @see {@link file://../shared/SectionHeader.tsx} SectionHeader 컴포넌트
 */
import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-md border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
