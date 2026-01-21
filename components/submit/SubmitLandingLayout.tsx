import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SubmitLandingLayoutProps {
  /** 문서함 제목 */
  title: string;
  /** 로고 이미지 URL */
  logoUrl: string;
  /** 제출 버튼 텍스트 */
  buttonText: string;
  /** 제출 버튼 클릭 시 이동할 URL (buttonOnClick과 함께 사용 불가) */
  buttonHref?: string;
  /** 제출 버튼 클릭 핸들러 (미리보기 모드용, buttonHref 대신 사용) */
  buttonOnClick?: () => void;
  /** 제목 아래 표시할 콘텐츠 (제출자 정보, 설명, 마감일, 서류 목록 등) */
  children: React.ReactNode;
  /** 제목 margin-bottom 클래스 (기본: 'mb-6') */
  titleClassName?: string;
}

export function SubmitLandingLayout({
  title,
  logoUrl,
  buttonText,
  buttonHref,
  buttonOnClick,
  children,
  titleClassName = 'mb-6',
}: SubmitLandingLayoutProps) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 영역 */}
        <div className="flex justify-center mb-6">
          <Image
            src={logoUrl}
            alt="로고"
            width={608}
            height={144}
            className="h-auto w-full max-w-[150px] object-contain"
            priority
          />
        </div>

        {/* 메인 카드 */}
        <Card>
          <CardContent className="py-6">
            {/* 문서함 제목 */}
            <h1
              className={cn(
                'text-2xl font-bold text-foreground text-center',
                titleClassName
              )}
            >
              {title}
            </h1>

            {/* 고유 콘텐츠 영역 */}
            {children}

            {/* 제출하기 버튼 */}
            {buttonOnClick ? (
              <Button variant="primary" size="lg" className="w-full" onClick={buttonOnClick}>
                {buttonText}
                <ArrowRight className="w-5 h-5" />
              </Button>
            ) : (
              <Button variant="primary" size="lg" className="w-full" asChild>
                <Link href={buttonHref!}>
                  {buttonText}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            )}

            {/* 안내 문구 */}
            <p className="text-sm text-muted-foreground text-center mt-6">
              제출한 문서는 안전하게 보관됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
