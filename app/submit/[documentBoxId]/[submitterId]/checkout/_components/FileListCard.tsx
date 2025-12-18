import { FileEdit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
      <CardContent>
        {/* 섹션 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              aria-label="파일 수정하기"
            >
              <FileEdit className="w-4 h-4" aria-hidden="true" />
              파일수정
            </Button>
          )}
        </div>

        {/* 파일 목록 - 각 파일이 개별 박스 */}
        <ul className="space-y-3" role="list">
          {files.map((file, index) => (
            <li
              key={index}
              className="border border-border rounded-lg px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-medium text-foreground mb-0.5">
                    {file.documentTitle}
                  </p>
                  {file.filename ? (
                    <p className="text-base text-muted-foreground truncate">
                      {file.filename}
                    </p>
                  ) : (
                    <p className="text-base text-muted-foreground/60 italic">
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
