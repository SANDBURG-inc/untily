'use client';

import { useState } from 'react';
import { SquarePen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { IconButton } from '@/components/shared/IconButton';
import { SaveButton } from '@/components/shared/SaveButton';

interface SubmitterInfo {
  name: string;
  email: string;
  phone: string;
}

interface SubmitterInfoCardProps {
  title: string;
  submitter: SubmitterInfo;
  onSave: (data: SubmitterInfo) => Promise<void>;
  className?: string;
}

function isKoreanName(name: string): boolean {
  const koreanRegex = /^[가-힣]{3,6}$/;
  return koreanRegex.test(name);
}

export default function SubmitterInfoCard({
  title,
  submitter,
  onSave,
  className = '',
}: SubmitterInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<SubmitterInfo>(submitter);
  const [errors, setErrors] = useState<Partial<Record<keyof SubmitterInfo, string>>>({});

  const handleEdit = () => {
    setIsEditing(true);
    // 한글 3~6글자가 아니면 빈 값으로 시작
    setEditData({
      ...submitter,
      name: isKoreanName(submitter.name) ? submitter.name : '',
    });
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SubmitterInfo, string>> = {};

    if (!editData.name.trim()) {
      newErrors.name = '성명을 입력해주세요.';
    }

    if (!editData.phone.trim()) {
      newErrors.phone = '연락처를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSave(editData);
      setIsEditing(false);
    } catch {
      // 에러는 부모 컴포넌트에서 처리
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof SubmitterInfo, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card className={className}>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          {!isEditing ? (
            <IconButton
              variant="outline"
              size="sm"
              icon={<SquarePen className="w-4 h-4" />}
              onClick={handleEdit}
              aria-label="정보 수정하기"
            >
              정보수정
            </IconButton>
          ) : (
            <SaveButton onClick={handleSave} isLoading={isSaving} />
          )}
        </div>

        <div className="space-y-3">
          {/* 성명 */}
          <div className={isEditing ? 'px-4 py-3' : 'border border-border rounded-lg px-4 py-3'}>
            {isEditing ? (
              <>
                <label className="text-sm font-bold text-foreground mb-1 flex items-center gap-1">
                  성명
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  value={editData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="한글 성함을 입력해주세요."
                  error={!!errors.name}
                  disabled={isSaving}
                />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
              </>
            ) : (
              <>
                <dt className="text-sm text-muted-foreground mb-1">성명</dt>
                <dd className="text-lg font-medium text-foreground">{submitter.name}</dd>
              </>
            )}
          </div>

          {/* 이메일 */}
          <div className={isEditing ? 'px-4 py-3' : 'border border-border rounded-lg px-4 py-3'}>
            {isEditing ? (
              <>
                <label className="text-sm font-bold text-foreground mb-1 block">이메일</label>
                <Input
                  type="email"
                  value={submitter.email}
                  disabled
                  className="bg-muted"
                />
              </>
            ) : (
              <>
                <dt className="text-sm text-muted-foreground mb-1">이메일</dt>
                <dd className="text-lg font-medium text-foreground">{submitter.email || '-'}</dd>
              </>
            )}
          </div>

          {/* 연락처 */}
          <div className={isEditing ? 'px-4 py-3' : 'border border-border rounded-lg px-4 py-3'}>
            {isEditing ? (
              <>
                <label className="text-sm font-bold text-foreground mb-1 flex items-center gap-1">
                  연락처
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="연락처를 입력해주세요."
                  error={!!errors.phone}
                  disabled={isSaving}
                />
                {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
              </>
            ) : (
              <>
                <dt className="text-sm text-muted-foreground mb-1">연락처</dt>
                <dd className="text-lg font-medium text-foreground">{submitter.phone || '-'}</dd>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
