'use client';

import { useContext, useState } from 'react';
import { AuthUIContext } from '@neondatabase/neon-js/auth/react/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Monitor, Smartphone, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { authClient } from '@/lib/auth/client';

interface Session {
  id: string;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: Date;
  createdAt: Date;
}

function parseUserAgent(userAgent?: string | null): { isMobile: boolean; osName?: string; browserName?: string } {
  if (!userAgent) return { isMobile: false };

  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);

  // 간단한 OS 파싱
  let osName: string | undefined;
  if (userAgent.includes('Windows')) osName = 'Windows';
  else if (userAgent.includes('Mac OS X')) osName = 'Mac OS';
  else if (userAgent.includes('Linux')) osName = 'Linux';
  else if (userAgent.includes('Android')) osName = 'Android';
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) osName = 'iOS';

  // 간단한 브라우저 파싱
  let browserName: string | undefined;
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browserName = 'Chrome';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browserName = 'Safari';
  else if (userAgent.includes('Firefox')) browserName = 'Firefox';
  else if (userAgent.includes('Edg')) browserName = 'Edge';

  return { isMobile, osName, browserName };
}

/**
 * 상대 시간 표시 (1분 전, 2시간 전, 3일 전 등)
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    // 7일 이상이면 날짜 표시
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  } else if (days > 0) {
    return `${days}일 전`;
  } else if (hours > 0) {
    return `${hours}시간 전`;
  } else if (minutes > 0) {
    return `${minutes}분 전`;
  } else {
    return '방금 전';
  }
}

/**
 * IP 주소를 지역 정보로 변환 (TODO: 서버 API 구현 필요)
 * 현재는 "대한민국" 고정 반환
 */
function getLocationFromIP(ipAddress?: string | null): string {
  // TODO: 서버 API 호출로 IP → 지역 정보 변환
  // 예: /api/geoip?ip=123.45.67.89
  // 무료 옵션: ip-api.com, ipapi.co
  // 유료 옵션: MaxMind GeoIP2, IPStack
  return '대한민국';
}

export function SessionsSection() {
  const { hooks } = useContext(AuthUIContext);
  const { data: sessions, isPending, refetch } = hooks.useListSessions?.() || { data: null, isPending: false };
  const { data: currentSession } = authClient.useSession();

  const [revokingSession, setRevokingSession] = useState<string | null>(null);
  const [removedSessions, setRemovedSessions] = useState<Set<string>>(new Set());

  const handleRevokeSession = async (session: Session) => {
    setRevokingSession(session.id);
    try {
      // TODO: Neon Auth의 revokeSession API 사용
      // await authClient.revokeSession({ token: session.token });
      console.log('Revoking session:', session.id);

      // 임시 처리: 로컬에서 제거
      await new Promise(resolve => setTimeout(resolve, 500));

      // 로컬 상태에서 제거
      setRemovedSessions(prev => new Set(prev).add(session.id));

      // 실제 API가 구현되면 refetch 호출
      await refetch?.();
    } catch (error) {
      console.error('Failed to revoke session:', error);
    } finally {
      setRevokingSession(null);
    }
  };

  // 제거된 세션 필터링
  const visibleSessions = sessions?.filter(
    (session: Session) => !removedSessions.has(session.id)
  ) || [];

  if (!hooks.useListSessions) {
    return null; // 세션 관리 기능이 없으면 섹션 숨김
  }

  if (isPending) {
    return (
      <Card variant="compact">
        <CardHeader variant="compact">
          <CardTitle>
            <SectionHeader icon={Monitor} title="활성 세션" size="lg" />
          </CardTitle>
        </CardHeader>
        <CardContent variant="compact">
          <p className="text-sm text-gray-500">세션 정보를 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="compact">
      <CardHeader variant="compact">
        <CardTitle>
          <SectionHeader
            icon={Monitor}
            title="활성 세션"
            description="로그인된 기기 목록을 확인하고 관리합니다."
            size="lg"
          />
        </CardTitle>
      </CardHeader>
      <CardContent variant="compact" className="space-y-3">
        {visibleSessions.length > 0 ? (
          visibleSessions.map((session: Session) => {
            const isCurrentSession = session.id === currentSession?.session?.id;
            const { isMobile, osName, browserName } = parseUserAgent(session.userAgent);
            const isRevoking = revokingSession === session.id;
            const location = getLocationFromIP(session.ipAddress);
            const timeInfo = isCurrentSession ? '현재 세션' : getRelativeTime(session.createdAt);

            return (
              <div
                key={session.id}
                className="flex items-start gap-3 p-3 border rounded-md hover:bg-gray-50 transition-colors"
              >
                {/* 아이콘 */}
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full flex-shrink-0">
                  {isMobile ? (
                    <Smartphone className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Monitor className="w-5 h-5 text-gray-600" />
                  )}
                </div>

                {/* 세션 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {osName || '알 수 없는 OS'}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {location}{session.ipAddress ? ` | ${session.ipAddress}` : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {timeInfo}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {browserName || '알 수 없는 브라우저'}
                  </p>

                  {/* 현재 세션 배지 */}
                  {isCurrentSession && (
                    <div className="flex items-center gap-1 mt-2">
                      <div className="flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-blue-600 font-medium">현재 세션</span>
                    </div>
                  )}
                </div>

                {/* 로그아웃 버튼 (현재 세션이 아닐 때만) */}
                {!isCurrentSession && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeSession(session)}
                    disabled={isRevoking}
                    className="flex-shrink-0"
                  >
                    {isRevoking ? '로그아웃 중...' : '이 기기 로그아웃'}
                  </Button>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500">활성 세션이 없습니다.</p>
        )}
      </CardContent>
    </Card>
  );
}
