import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hoverable?: boolean;
}

export default function Card({ children, className = '', hoverable = false }: CardProps) {
    return (
        <div
            className={`
        bg-white 
        border border-neutral-200 
        rounded-lg 
        shadow-soft 
        overflow-hidden
        ${hoverable ? 'transition-all duration-200 hover:shadow-medium hover:border-neutral-300' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    );
}

interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

Card.Header = function CardHeader({ children, className = '' }: CardHeaderProps) {
    return (
        <div className={`px-5 py-4 border-b border-neutral-200 ${className}`}>
            {children}
        </div>
    );
};

interface CardBodyProps {
    children: React.ReactNode;
    className?: string;
}

Card.Body = function CardBody({ children, className = '' }: CardBodyProps) {
    return (
        <div className={`px-5 py-4 ${className}`}>
            {children}
        </div>
    );
};

interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
}

Card.Footer = function CardFooter({ children, className = '' }: CardFooterProps) {
    return (
        <div className={`px-5 py-4 bg-neutral-50 border-t border-neutral-200 ${className}`}>
            {children}
        </div>
    );
};
