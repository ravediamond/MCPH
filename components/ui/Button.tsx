import React from 'react';

type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
type ButtonColorScheme = 'blue' | 'gray' | 'green' | 'red' | 'yellow';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    colorScheme?: ButtonColorScheme;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    isFullWidth?: boolean;
    isLoading?: boolean;
    isDisabled?: boolean;
}

export const Button = ({
    children,
    variant = 'solid',
    size = 'md',
    colorScheme = 'blue',
    leftIcon,
    rightIcon,
    isFullWidth = false,
    isLoading = false,
    isDisabled = false,
    className = '',
    ...rest
}: ButtonProps) => {
    // Size classes
    const sizeClasses = {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    // Variant and color classes
    const variantClasses: Record<ButtonVariant, Record<ButtonColorScheme, string>> = {
        solid: {
            blue: 'bg-blue-500 hover:bg-blue-600 text-white',
            gray: 'bg-gray-500 hover:bg-gray-600 text-white',
            green: 'bg-green-500 hover:bg-green-600 text-white',
            red: 'bg-red-500 hover:bg-red-600 text-white',
            yellow: 'bg-yellow-500 hover:bg-yellow-600 text-white',
        },
        outline: {
            blue: 'border border-blue-500 text-blue-500 hover:bg-blue-50',
            gray: 'border border-gray-500 text-gray-500 hover:bg-gray-50',
            green: 'border border-green-500 text-green-500 hover:bg-green-50',
            red: 'border border-red-500 text-red-500 hover:bg-red-50',
            yellow: 'border border-yellow-500 text-yellow-500 hover:bg-yellow-50',
        },
        ghost: {
            blue: 'text-blue-500 hover:bg-blue-50',
            gray: 'text-gray-500 hover:bg-gray-50',
            green: 'text-green-500 hover:bg-green-50',
            red: 'text-red-500 hover:bg-red-50',
            yellow: 'text-yellow-500 hover:bg-yellow-50',
        },
        link: {
            blue: 'text-blue-500 hover:underline p-0',
            gray: 'text-gray-500 hover:underline p-0',
            green: 'text-green-500 hover:underline p-0',
            red: 'text-red-500 hover:underline p-0',
            yellow: 'text-yellow-500 hover:underline p-0',
        },
    };

    const buttonClasses = `
    rounded font-medium ${sizeClasses[size]} ${variantClasses[variant][colorScheme]}
    ${isFullWidth ? 'w-full' : ''}
    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
    transition duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-${colorScheme}-500 focus:ring-opacity-50
    flex items-center justify-center gap-2
    ${className}
  `;

    return (
        <button
            className={buttonClasses}
            disabled={isDisabled || isLoading}
            {...rest}
        >
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {leftIcon && !isLoading && <span>{leftIcon}</span>}
            {children}
            {rightIcon && <span>{rightIcon}</span>}
        </button>
    );
};
