import React, { forwardRef } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    helperText?: string;
    error?: string;
    leftElement?: React.ReactNode;
    rightElement?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
    isFullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({
        label,
        helperText,
        error,
        leftElement,
        rightElement,
        size = 'md',
        isFullWidth = false,
        className = '',
        ...rest
    }, ref) => {
        const sizeClasses = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-base',
            lg: 'px-6 py-3 text-lg',
        };

        const baseInputClasses = `
      rounded-md
      border
      shadow-sm
      focus:ring-2
      focus:ring-blue-500
      focus:border-blue-500
      block
      ${isFullWidth ? 'w-full' : ''}
      ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
      ${sizeClasses[size]}
      ${leftElement ? 'pl-10' : ''}
      ${rightElement ? 'pr-10' : ''}
      bg-white dark:bg-gray-700
      text-gray-900 dark:text-white
      ${className}
    `;

        return (
            <div className={`${isFullWidth ? 'w-full' : ''}`}>
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftElement && (
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            {leftElement}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={baseInputClasses}
                        {...rest}
                    />
                    {rightElement && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            {rightElement}
                        </div>
                    )}
                </div>
                {helperText && !error && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
                )}
                {error && (
                    <p className="mt-1 text-xs text-red-500">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
