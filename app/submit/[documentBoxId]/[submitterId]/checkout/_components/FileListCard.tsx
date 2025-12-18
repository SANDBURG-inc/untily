import { FileEdit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardAction, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';

interface FileItem {
  documentTitle: string;
  isRequired: boolean;
  filename: string | null;
}

interface FileListCardProps {
  title: string;
  files: FileItem[];
  onEdit?: () => void;
  className?: string;
}

export default function FileListCard({
  title,
  files,
  onEdit,
  className = '',
}: FileListCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
        {onEdit && (
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              aria-label="파일 수정하기"
            >
              <FileEdit className="w-4 h-4" aria-hidden="true" />
              파일수정
            </Button>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <ul className="divide-y divide-border" role="list">
          {files.map((file, index) => (
            <li key={index} className="py-3 first:pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground mb-0.5">
                    {file.documentTitle}
                  </p>
                  {file.filename ? (
                    <p className="text-xs text-muted-foreground truncate">
                      {file.filename}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground/60 italic">
                      파일 없음
                    </p>
                  )}
                </div>
                <Badge variant={file.isRequired ? 'required' : 'optional'}>
                  {file.isRequired ? '필수서류' : '선택'}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
