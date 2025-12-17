import { forwardRef, type ReactNode } from 'react';
import Link from 'next/link';
import { Button, type buttonVariants } from '@/components/ui/Button';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * IconButton 컴포넌트
 *
 * shadcn/ui Button을 래핑하여 아이콘 + 텍스트 조합을 편리하게 사용할 수 있도록 한 컴포넌트입니다.
 *
 * ## 왜 IconButton을 만들었는가?
 *
 * shadcn Button만으로도 아이콘 버튼을 만들 수 있지만, 매번 아이콘 위치와 children을
 * 직접 조합해야 합니다. IconButton은 이를 추상화하여:
 *
 * 1. **일관된 아이콘 배치**: `iconPosition` prop으로 left/right 위치를 명시적으로 지정
 * 2. **Link 지원 간소화**: `as="link"`와 `href`만으로 Next.js Link로 렌더링
 * 3. **프로젝트 표준화**: 팀 전체에서 아이콘 버튼의 일관된 패턴 유지
 *
 * ## Button과의 차이점
 *
 * ```tsx
 * // Button 직접 사용 - 유연하지만 매번 조합 필요
 * <Button variant="primary">
 *   <PlusIcon />
 *   새로 만들기
 * </Button>
 *
 * // IconButton 사용 - 명시적이고 일관된 API
 * <IconButton variant="primary" icon={<PlusIcon />}>
 *   새로 만들기
 * </IconButton>
 * ```
 *
 * ## 사용 예시
 *
 * ```tsx
 * // 기본 사용 (아이콘 왼쪽)
 * <IconButton icon={<PlusIcon />}>추가</IconButton>
 *
 * // 아이콘 오른쪽 배치
 * <IconButton icon={<ArrowRightIcon />} iconPosition="right">
 *   다음
 * </IconButton>
 *
 * // Link로 사용
 * <IconButton as="link" href="/edit" icon={<EditIcon />} variant="secondary">
 *   수정
 * </IconButton>
 *
 * // 아이콘만 있는 버튼
 * <IconButton icon={<MenuIcon />} size="icon" aria-label="메뉴" />
 * ```
 *
 * ## 언제 Button을 직접 사용하는가?
 *
 * - 아이콘 없이 텍스트만 있는 버튼
 * - 여러 아이콘이나 복잡한 레이아웃이 필요한 경우
 * - asChild 패턴으로 커스텀 컴포넌트를 렌더링해야 하는 경우
 *
 * @see {@link Button} - 기반이 되는 shadcn Button 컴포넌트
 */

type IconButtonProps = VariantProps<typeof buttonVariants> & {
    /** 버튼에 표시할 아이콘 */
    icon?: ReactNode;
    /** 아이콘 위치 (기본값: 'left') */
    iconPosition?: 'left' | 'right';
    /** 추가 CSS 클래스 */
    className?: string;
    /** 버튼 내용 */
    children?: ReactNode;
} & (
        | ({
              /** 버튼으로 렌더링 (기본값) */
              as?: 'button';
              href?: never;
          } & Omit<React.ComponentProps<'button'>, 'className'>)
        | {
              /** Next.js Link로 렌더링 */
              as: 'link';
              /** 링크 대상 URL */
              href: string;
          }
    );

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    function IconButton(props, ref) {
        const {
            variant,
            size,
            icon,
            iconPosition = 'left',
            children,
            className,
            ...restProps
        } = props;

        const content = (
            <>
                {icon && iconPosition === 'left' && icon}
                {children}
                {icon && iconPosition === 'right' && icon}
            </>
        );

        // Link로 렌더링
        if (props.as === 'link') {
            return (
                <Button variant={variant} size={size} className={cn(className)} asChild>
                    <Link href={props.href}>
                        {content}
                    </Link>
                </Button>
            );
        }

        // Button으로 렌더링
        const { as, href, ...buttonProps } = restProps as Omit<
            Extract<IconButtonProps, { as?: 'button' }>,
            'icon' | 'iconPosition' | 'children' | 'className' | 'variant' | 'size'
        >;

        return (
            <Button
                ref={ref}
                variant={variant}
                size={size}
                className={cn(className)}
                {...buttonProps}
            >
                {content}
            </Button>
        );
    }
);
