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
        border border-gray-200 
        rounded-lg 
        shadow-sm 
        overflow-hidden
        ${hoverable ? 'transition-all duration-200 hover:shadow-md hover:border-gray-300' : ''}
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
        <div className={`px-5 py-4 border-b border-gray-200 ${className}`}>
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
        <div className={`px-5 py-4 bg-gray-50 border-t border-gray-200 ${className}`}>
            {children}
        </div>
    );
};
