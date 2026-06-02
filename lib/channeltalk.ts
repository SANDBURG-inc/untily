/**
 * ChannelTalk(ChannelIO) 런처 버튼 제어 헬퍼.
 *
 * ChannelIO는 `app/layout.tsx`에서 boot되며 window 전역으로 주입된다.
 * 스크립트 로드 전 호출도 ChannelIO 내부 큐(ch.q)에 버퍼링되므로 안전하나,
 * 타입 안전을 위해 optional 호출로 가드한다.
 *
 * 위치(좌/우)·여백은 SDK로 변경 불가(채널 데스크 관리자 설정 전용)이므로,
 * 시트/모달과의 겹침은 표시/숨김으로만 해결한다.
 */

type ChannelIOCommand = 'showChannelButton' | 'hideChannelButton';

declare global {
    interface Window {
        ChannelIO?: (command: ChannelIOCommand, ...args: unknown[]) => void;
    }
}

/** 채널톡 런처 버튼 숨김 (진행 중 채팅창은 유지됨). */
export function hideChannelButton(): void {
    if (typeof window === 'undefined') return;
    window.ChannelIO?.('hideChannelButton');
}

/** 채널톡 런처 버튼 표시. */
export function showChannelButton(): void {
    if (typeof window === 'undefined') return;
    window.ChannelIO?.('showChannelButton');
}
