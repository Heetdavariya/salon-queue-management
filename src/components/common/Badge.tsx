import React from 'react';
import { QueueStatus, BarberStatus } from '../../domain/types';
import { useTranslation } from '../../i18n';

interface StatusBadgeProps {
  status: QueueStatus | BarberStatus | 'OFF_DUTY';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className = '' }) => {
  const { t } = useTranslation();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3.5 py-1.5 text-sm font-bold'
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'WAITING':
        return {
          label: t('statusWaiting'),
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400'
        };
      case 'CALLED':
        return {
          label: t('statusCalled'),
          bg: 'bg-gold-500/20 text-gold-300 border-gold-400/50 animate-pulse',
          dot: 'bg-gold-400'
        };
      case 'IN_CHAIR':
        return {
          label: t('statusInChair'),
          bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          dot: 'bg-blue-400'
        };
      case 'DONE':
        return {
          label: t('statusDone'),
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400'
        };
      case 'CANCELLED':
        return {
          label: t('statusCancelled'),
          bg: 'bg-gray-500/15 text-gray-400 border-gray-600/30',
          dot: 'bg-gray-400'
        };
      case 'NO_SHOW':
        return {
          label: t('statusNoShow'),
          bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          dot: 'bg-rose-400'
        };
      case 'AVAILABLE':
        return {
          label: t('available'),
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400'
        };
      case 'ON_BREAK':
        return {
          label: t('onBreak'),
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400'
        };
      case 'OFF_DUTY':
        return {
          label: t('offDuty'),
          bg: 'bg-gray-500/15 text-gray-400 border-gray-600/30',
          dot: 'bg-gray-500'
        };
      default:
        return {
          label: status,
          bg: 'bg-gray-500/15 text-gray-300 border-gray-600/30',
          dot: 'bg-gray-400'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses[size]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};
