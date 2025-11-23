import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'lg';
  animated?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'lg', animated = true }) => {
  const dimensions = size === 'lg' ? 'w-32 h-32' : 'w-10 h-10';
  const strokeWidth = size === 'lg' ? 2 : 3;

  return (
    <div className={`relative flex items-center justify-center ${dimensions}`}>
      {/* Outer Ring */}
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full text-brand-primary"
        animate={animated ? { rotate: 360 } : {}}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="10 10" opacity="0.5" />
      </motion.svg>

      {/* Face Scan Icon */}
      <svg
        viewBox="0 0 24 24"
        className={`${size === 'lg' ? 'w-16 h-16' : 'w-6 h-6'} text-white dark:text-white light:text-gray-900 z-10 transition-colors duration-300`}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        <motion.path 
             d="M9 10a1 1 0 0 1 2 0v2a1 1 0 1 1-2 0v-2zm4 0a1 1 0 0 1 2 0v2a1 1 0 1 1-2 0v-2z"
             initial={{ opacity: 0.5 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
        />
        <path d="M15 15c-1 1-2.5 1-3.5 1s-2.5 0-3.5-1" />
      </svg>

      {/* Scanning Beam (Only for large animated version) */}
      {animated && size === 'lg' && (
        <motion.div
          className="absolute w-full h-1 bg-brand-secondary/80 dark:bg-brand-secondary/80 light:bg-brand-secondary/60 shadow-[0_0_15px_rgba(50,210,240,0.8)] dark:shadow-[0_0_15px_rgba(50,210,240,0.8)] light:shadow-[0_0_15px_rgba(50,210,240,0.6)] transition-all duration-300"
          initial={{ top: '10%' }}
          animate={{ top: '90%' }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
      )}
    </div>
  );
};

export default Logo;