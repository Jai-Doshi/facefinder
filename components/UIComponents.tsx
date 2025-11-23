import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export const GradientButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  fullWidth?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  className?: string;
}> = ({ children, onClick, fullWidth, loading, variant = 'primary', className = '' }) => {
  
  let baseClass = "relative overflow-hidden rounded-xl font-semibold py-4 px-6 transition-all duration-300 flex items-center justify-center gap-2 ";
  
  if (variant === 'primary') {
    baseClass += "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-[0_0_20px_rgba(124,92,255,0.4)] hover:shadow-[0_0_30px_rgba(50,210,240,0.6)] dark:shadow-[0_0_20px_rgba(124,92,255,0.4)] light:shadow-[0_0_20px_rgba(124,92,255,0.3)] ";
  } else if (variant === 'outline') {
    baseClass += "border border-white/30 dark:border-white/30 light:border-gray-300 text-white dark:text-white light:text-gray-900 hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-gray-100 ";
  } else {
    baseClass += "text-white/70 dark:text-white/70 light:text-gray-700 hover:text-white dark:hover:text-white light:hover:text-gray-900 ";
  }

  if (fullWidth) baseClass += "w-full ";

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClass} ${className}`}
      onClick={onClick}
      disabled={loading}
    >
      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
      {children}
    </motion.button>
  );
};

export const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = "", onClick }) => {
  return (
    <motion.div
      onClick={onClick}
      className={`glass-panel rounded-2xl p-5 ${className} ${onClick ? 'cursor-pointer' : ''}`}
      whileHover={onClick ? { 
        y: -5, 
        boxShadow: '0 10px 30px -10px rgba(124,92,255,0.3)'
      } : {}}
    >
      {children}
    </motion.div>
  );
};
