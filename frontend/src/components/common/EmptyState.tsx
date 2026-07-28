import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => {
  return (
    <div className="max-w-md mx-auto my-12 p-12 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 text-center space-y-4">
      <div className="space-y-1">
        <h3 className="font-bold text-black text-lg">{title}</h3>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
      {action && <div className="pt-2 flex justify-center">{action}</div>}
    </div>
  );
};

export default EmptyState;
