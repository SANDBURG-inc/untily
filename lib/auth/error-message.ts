export const getAuthErrorMessage = (error: unknown): string => {
    let code: string | undefined;
    let message: string | undefined;

    if (error && typeof error === 'object') {
        if ('code' in error) {
            code = (error as { code: string }).code;
        }
        if ('body' in error && error.body && typeof error.body === 'object' && 'code' in error.body) {
            code = (error.body as { code: string }).code;
        }

        if ('message' in error) {
            message = (error as { message: string }).message;
        }
        if ('body' in error && error.body && typeof error.body === 'object' && 'message' in error.body) {
            message = (error.body as { message: string }).message;
        }
        
    }

    // 1. 에러 코드로 우선 확인
    if (code) {
        switch (code) {
            case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
            case 'USER_ALREADY_EXISTS': // 일부 경우 대비
                return '이미 가입된 이메일입니다. 다른 이메일을 사용해주세요.';
            
            case 'INVALID_EMAIL':
                return '유효하지 않은 이메일 형식입니다.';
            
            case 'WEAK_PASSWORD':
            case 'PASSWORD_TOO_WEAK':
                return '비밀번호가 너무 약합니다. 8자 이상, 영문/숫자/특수문자를 포함해주세요.';

            case 'INVALID_PASSWORD':
            case 'INVALID_EMAIL_OR_PASSWORD':
                return '이메일 또는 비밀번호가 올바르지 않습니다.';

            case 'USER_NOT_FOUND':
                return '가입되지 않은 이메일입니다.';

            case 'INVALID_INPUT':
                // Better Auth가 중복 에러를 INVALID_INPUT으로 내보낼 때 메시지 확인
                if (message?.includes('User already exists')) {
                    return '이미 가입된 이메일입니다. 다른 이메일을 사용해주세요.';
                }
                return '입력 값이 올바르지 않습니다.';
            
            case 'TOO_MANY_REQUESTS':
                return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
        }
    }

    // 2. 메시지 텍스트로 보완 확인 (코드가 없거나 매핑되지 않은 경우)
    if (message) {
        if (message.includes('User already exists')) {
            return '이미 가입된 이메일입니다. 다른 이메일을 사용해주세요.';
        }
        if (message.includes('Invalid email')) {
            return '유효하지 않은 이메일 형식입니다.';
        }
        if (message.includes('Too many requests')) {
            return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
        }
        // 기본적으로는 서버 메시지를 보여주되, 너무 기술적인 메시지라면 가림 필요
        // 여기서는 서버 메시지를 그대로 보여주는 정책을 유지 (fallback)
        return message; 
    }

    // 3. 알 수 없는 에러
    return '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
};
