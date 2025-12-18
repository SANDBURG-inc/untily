import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface InfoCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

interface FieldProps {
  label: string;
  value: string;
}

function InfoCard({ title, children, className = '' }: InfoCardProps) {
  return (
    <Card className={className}>
      <CardContent>
        {/* 섹션 제목 */}
        <h3 className="text-lg font-bold text-foreground mb-4">{title}</h3>

        {/* 필드 목록 - 각 필드가 개별 박스 */}
        <div className="space-y-3">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: FieldProps) {
  return (
    <div className="border border-border rounded-lg px-4 py-3">
      <dt className="text-sm text-muted-foreground mb-1">{label}</dt>
      <dd className="text-lg font-medium text-foreground">{value}</dd>
    </div>
  );
}

InfoCard.Field = Field;

export default InfoCard;
