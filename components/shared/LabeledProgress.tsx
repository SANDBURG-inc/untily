'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface LabeledProgressProps {
  label: string;
  current: number;
  total: number;
  displayMode?: 'count' | 'percentage';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export function LabeledProgress({
  label,
  current,
  total,
  displayMode = 'count',
  size = 'sm',
  showValue = true,
  className,
}: LabeledProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  const renderValue = () => {
    if (!showValue) return null;

    if (displayMode === 'percentage') {
      return (
          `${percentage}%`
      );
    }

    return (
        `${current}/${total}`
    );
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        {/* Label - LEFT */}
        <span className="text-base">{label}</span>
        {/* Value - RIGHT */}
        <span className="text-base text-primary">{renderValue()}</span>
      </div>
      <Progress value={percentage} size={size} />
    </div>
  );
}
