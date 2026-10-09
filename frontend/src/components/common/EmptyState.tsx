import React from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = React.memo(({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`max-w-md mx-auto my-12 p-8 sm:p-12 rounded-3xl border border-dashed border-neutral-300 bg-neutral-50/50 text-center space-y-5 flex flex-col items-center justify-center transition-all duration-300 hover:bg-neutral-50/80 shadow-xs ${className}`}
    >
      {icon && (
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 mb-2 shadow-2xs">
          {icon}
        </div>
      )}
      <div className="space-y-1.5">
        <h3 className="font-bold text-neutral-900 text-xl tracking-tight">{title}</h3>
        <p className="text-sm text-neutral-500 max-w-[280px] mx-auto leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-4 flex justify-center w-full">{action}</div>}
    </motion.div>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;
