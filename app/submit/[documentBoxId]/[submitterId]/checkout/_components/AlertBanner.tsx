import { Info, AlertCircle } from 'lucide-react';

type AlertType = 'info' | 'error' | 'warning' | 'success';

interface AlertBannerProps {
  type: AlertType;
  message: string;
  className?: string;
}

const alertStyles: Record<AlertType, { bg: string; text: string; icon: typeof Info }> = {
  info: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    icon: Info,
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    icon: AlertCircle,
  },
  warning: {
    bg: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-700',
    icon: AlertCircle,
  },
  success: {
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-700',
    icon: Info,
  },
};

export default function AlertBanner({
  type,
  message,
  className = '',
}: AlertBannerProps) {
  const styles = alertStyles[type];
  const Icon = styles.icon;

  return (
    <div
      role="alert"
      className={`flex items-start gap-2 px-4 py-3 rounded-xl border ${styles.bg} ${className}`}
    >
      <Icon
        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.text}`}
        aria-hidden="true"
      />
      <p className={`text-sm ${styles.text}`}>{message}</p>
    </div>
  );
}
