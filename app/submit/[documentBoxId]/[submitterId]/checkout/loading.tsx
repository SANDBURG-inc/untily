import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function CheckoutLoading() {
  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* 페이지 헤더 스켈레톤 */}
        <div className="text-center mb-8">
          <div className="h-8 w-48 bg-muted rounded animate-pulse mx-auto mb-2" />
          <div className="h-5 w-64 bg-muted rounded animate-pulse mx-auto" />
        </div>

        {/* 카드 스켈레톤 */}
        <Card className="mb-4">
          <CardContent>
            <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
            <div className="space-y-3">
              <div className="border border-border rounded-lg p-4">
                <div className="h-4 w-16 bg-muted rounded animate-pulse mb-2" />
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent>
            <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-border rounded-lg p-4">
                  <div className="h-4 w-16 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-6 w-36 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 로딩 인디케이터 */}
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    </div>
  );
}
