'use client';

import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';

interface StarRatingProps {
    initialRating?: number;
    onChange?: (rating: number) => void;
    readOnly?: boolean;
    size?: number;
    className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
    initialRating = 0,
    onChange,
    readOnly = false,
    size = 24,
    className = '',
}) => {
    const [rating, setRating] = useState<number>(initialRating);
    const [hover, setHover] = useState<number | null>(null);

    const handleClick = (currentRating: number) => {
        if (readOnly) return;
        setRating(currentRating);
        if (onChange) {
            onChange(currentRating);
        }
    };

    return (
        <div className={`flex ${className}`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                    key={star}
                    className={`cursor-${readOnly ? 'default' : 'pointer'} transition-colors duration-200`}
                    color={(hover !== null ? hover >= star : rating >= star) ? '#FFD700' : '#e4e5e9'}
                    size={size}
                    onClick={() => handleClick(star)}
                    onMouseEnter={() => !readOnly && setHover(star)}
                    onMouseLeave={() => !readOnly && setHover(null)}
                />
            ))}
        </div>
    );
};

export default StarRating;