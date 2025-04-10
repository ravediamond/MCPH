import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => {
    return (
        <div className={`bg-white dark:bg-gray-800 shadow rounded-lg ${className}`}>
            {children}
        </div>
    );
};

interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export const CardHeader = ({ children, className = '' }: CardHeaderProps) => {
    return (
        <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
            {children}
        </div>
    );
};

interface CardBodyProps {
    children: React.ReactNode;
    className?: string;
}

export const CardBody = ({ children, className = '' }: CardBodyProps) => {
    return (
        <div className={`px-6 py-4 ${className}`}>
            {children}
        </div>
    );
};

interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
}

export const CardFooter = ({ children, className = '' }: CardFooterProps) => {
    return (
        <div className={`px-6 py-4 border-t border-gray-200 dark:border-gray-700 ${className}`}>
            {children}
        </div>
    );
};
