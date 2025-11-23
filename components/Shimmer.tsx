import React from 'react';

interface ShimmerProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Shimmer: React.FC<ShimmerProps> = ({ 
  className = '', 
  width = '100%', 
  height = '1rem',
  rounded = 'md'
}) => {
  const roundedClass = {
    'none': 'rounded-none',
    'sm': 'rounded-sm',
    'md': 'rounded-md',
    'lg': 'rounded-lg',
    'xl': 'rounded-xl',
    'full': 'rounded-full'
  }[rounded];

  return (
    <div
      className={`shimmer-loading ${roundedClass} ${className}`}
      style={{ width, height }}
    />
  );
};

export const ShimmerCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`glass-panel p-6 space-y-4 ${className}`}>
      <Shimmer height="1.5rem" width="60%" />
      <Shimmer height="1rem" width="100%" />
      <Shimmer height="1rem" width="80%" />
    </div>
  );
};

export const ShimmerImage: React.FC<{ className?: string; aspectRatio?: string }> = ({ 
  className = '', 
  aspectRatio = 'aspect-square' 
}) => {
  return (
    <div className={`shimmer-loading rounded-xl ${aspectRatio} ${className}`} />
  );
};

export const ShimmerText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className = '' 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer 
          key={i} 
          height="1rem" 
          width={i === lines - 1 ? '60%' : '100%'} 
        />
      ))}
    </div>
  );
};

