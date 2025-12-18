import { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border pt-0">
        {children}
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: FieldProps) {
  return (
    <dl className="py-3 first:pt-4">
      <dt className="text-xs text-muted-foreground mb-1">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </dl>
  );
}

InfoCard.Field = Field;

export default InfoCard;
