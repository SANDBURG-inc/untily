import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import Link from 'next/link';

/**
 * Button 컴포넌트 variants:
 * - primary: 파란 배경 CTA 버튼
 * - secondary: 흰 배경, 회색 테두리 일반 버튼
 * - outline-primary: 흰 배경, 파란 테두리 버튼
 */

type ButtonVariant = 'primary' | 'secondary' | 'outline-primary';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonBaseProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: ReactNode;
    iconPosition?: 'left' | 'right';
    className?: string;
}

type ButtonAsButtonProps = ButtonBaseProps &
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
        as?: 'button';
        href?: never;
    };

type ButtonAsLinkProps = ButtonBaseProps & {
    as: 'link';
    href: string;
    children: ReactNode;
};

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const variantStyles: Record<ButtonVariant, string> = {
    'primary': 'bg-blue-600 hover:bg-blue-700 text-white',
    'secondary': 'bg-white hover:bg-gray-50 text-gray-700 border border-[#E2E8F0]',
    'outline-primary': 'bg-white hover:bg-blue-50 text-blue-600 border border-blue-600',
};

const sizeStyles: Record<ButtonSize, string> = {
    'sm': 'px-3 py-1.5 text-xs',
    'md': 'px-4 py-2 text-sm',
    'lg': 'px-5 py-2.5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    function Button(props, ref) {
        const {
            variant = 'primary',
            size = 'md',
            icon,
            iconPosition = 'left',
            children,
            className = '',
            ...restProps
        } = props;

        const baseStyles = 'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-colors';
        const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

        const content = (
            <>
                {icon && iconPosition === 'left' && icon}
                {children}
                {icon && iconPosition === 'right' && icon}
            </>
        );

        if (props.as === 'link') {
            return (
                <Link href={props.href} className={combinedStyles}>
                    {content}
                </Link>
            );
        }

        const { as, href, ...buttonProps } = restProps as Omit<ButtonAsButtonProps, keyof ButtonBaseProps | 'children'>;
        return (
            <button ref={ref} className={combinedStyles} {...buttonProps}>
                {content}
            </button>
        );
    }
);
