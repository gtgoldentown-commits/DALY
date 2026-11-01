/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  onClick
}) => {
  const sizeClasses = {
    sm: 'h-7 md:h-8',
    md: 'h-9 md:h-11',
    lg: 'h-12 md:h-14',
    xl: 'h-16 md:h-20'
  }[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      role={onClick ? 'button' : undefined}
      aria-label="TEATRO Home"
    >
      <img
        src="/assets/aistudio/teatro_logo_transparent.png"
        alt="TEATRO"
        className={`${sizeClasses} w-auto object-contain transition-transform duration-200 hover:scale-[1.02]`}
        loading="eager"
      />
    </div>
  );
};
