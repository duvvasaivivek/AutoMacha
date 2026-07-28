import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'OPEN':
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/80">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span>Open</span>
        </span>
      );
    case 'CLOSED':
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300/80">
          <span>Closed</span>
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-300/80">
          <span>Cancelled</span>
        </span>
      );
    case 'EXPIRED':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-300">
          <span>Expired</span>
        </span>
      );
  }
};

export default StatusBadge;
