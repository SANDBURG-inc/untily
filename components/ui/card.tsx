/**
 * Card 컴포넌트 (shadcn/ui 기반)
 *
 * 카드 레이아웃을 위한 기본 컴포넌트입니다.
 *
 * ## Variants
 * - `default`: shadcn 기본 스타일 (border, shadow, py-6, gap-6)
 * - `compact`: 상세 페이지용 (border-gray-200, no shadow, tight spacing px-6)
 * - `form`: 폼 페이지용 (no border, no shadow, wider spacing px-8)
 *
 * ## 섹션 타이틀 스타일 통일
 * 카드 내 섹션 타이틀에는 `@/components/shared/SectionHeader`를 사용하세요.
 *
 * @example
 * ```tsx
 * // 상세 페이지 (compact)
 * <Card variant="compact" className="mb-6">
 *   <CardHeader variant="compact">
 *     <CardTitle>
 *       <SectionHeader icon={FileText} title="제출 현황" />
 *     </CardTitle>
 *   </CardHeader>
 *   <CardContent variant="compact">...</CardContent>
 * </Card>
 *
 * // 폼 페이지 (form)
 * <Card variant="form" className="mb-6">
 *   <CardHeader variant="form">
 *     <CardTitle>
 *       <SectionHeader icon={FileText} title="기본 정보" size="sm" />
 *     </CardTitle>
 *   </CardHeader>
 *   <CardContent variant="form">...</CardContent>
 * </Card>
 * ```
 *
 * @see {@link file://../shared/SectionHeader.tsx} SectionHeader 컴포넌트
 */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// ============================================================================
// Card Variants
// ============================================================================

const cardVariants = cva(
  "bg-card text-card-foreground flex flex-col rounded-md",
  {
    variants: {
      variant: {
        default: "gap-6 border py-6 shadow-sm",
        compact: "gap-0 border border-gray-200 py-0 shadow-none",
        form: "gap-0 py-0 shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const cardHeaderVariants = cva(
  "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
  {
    variants: {
      variant: {
        default: "px-6",
        compact: "px-6 pt-6 pb-3",
        form: "px-8 pt-8 pb-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const cardContentVariants = cva(
  "",
  {
    variants: {
      variant: {
        default: "px-6",
        compact: "px-6 pt-0 pb-6",
        form: "px-8 pb-8 pt-6",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const cardFooterVariants = cva(
  "flex items-center [.border-t]:pt-6",
  {
    variants: {
      variant: {
        default: "px-6",
        compact: "px-6 pt-0 pb-6",
        form: "px-8 pb-8",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// ============================================================================
// Card Components
// ============================================================================

function Card({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
}

function CardHeader({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardHeaderVariants>) {
  return (
    <div
      data-slot="card-header"
      className={cn(cardHeaderVariants({ variant }), className)}
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

function CardContent({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardContentVariants>) {
  return (
    <div
      data-slot="card-content"
      className={cn(cardContentVariants({ variant }), className)}
      {...props}
    />
  )
}

function CardFooter({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardFooterVariants>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(cardFooterVariants({ variant }), className)}
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
  cardVariants,
  cardHeaderVariants,
  cardContentVariants,
  cardFooterVariants,
}
