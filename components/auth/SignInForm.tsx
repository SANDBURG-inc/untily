
'use client';

import { useRouter } from "next/navigation";
import { useStackApp } from "@stackframe/stack";
import { useState } from "react";
import Image from "next/image";

export default function SignInForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const app = useStackApp();
    const router = useRouter();

    const onSubmit = async () => {
        if (!email || !password) {
            setError('이메일과 비밀번호를 모두 입력해주세요.');
            return;
        }

        // Attempt to sign in
        const result = await app.signInWithCredential({ email, password });

        if (result.status === 'error') {
            setError(result.error.message);
        }
        // Success is handled by automatic redirect
    };

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-64 h-16 mb-8">
                <Image
                    src="/logo_sandburg.png"
                    alt="샌드버그"
                    fill
                    className="object-contain"
                />
            </div>

            <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm w-[400px]">
                <div className="flex flex-col items-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">관리자 로그인</h3>
                    <p className="text-gray-500 text-sm">서류 취합, 간편하게 관리하세요.</p>
                </div>

                <div className="w-full mb-6">
                    <button
                        onClick={() => app.signInWithOAuth('google')}
                        className="w-full py-3 px-4 bg-white border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4" />
                            <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.63 12 18.63C9.14 18.63 6.71 16.7 5.84 14.09H2.18V16.93C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
                            <path d="M5.84 14.09C5.62 13.43 5.49 12.73 5.49 12C5.49 11.27 5.62 10.57 5.84 9.91V7.07H2.18C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.18 16.93L5.84 14.09Z" fill="#FBBC05" />
                            <path d="M12 5.38C13.62 5.38 15.06 5.94 16.21 7.02L19.37 3.86C17.46 2.09 14.97 1 12 1C7.7 1 3.99 3.47 2.18 7.07L5.84 9.91C6.71 7.3 9.14 5.38 12 5.38Z" fill="#EA4335" />
                        </svg>
                        Google로 계속하기
                    </button>

                    <div className="relative flex items-center w-full mt-6">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">또는</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-500 text-sm rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="block text-sm font-bold text-gray-700">이메일</label>
                        <input
                            type="email"
                            placeholder="이메일을 입력해주세요"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 text-black"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-bold text-gray-700">비밀번호</label>
                        <input
                            type="password"
                            placeholder="비밀번호를 입력해주세요"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 text-black"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors mt-2"
                    >
                        로그인
                    </button>
                </form>

                <div className="mt-6 flex flex-col items-center gap-2">
                    <button
                        type="button"
                        className="text-gray-400 text-sm hover:text-gray-600 transition-colors"
                        onClick={() => router.push('/forgot-password')}
                    >
                        비밀번호를 잊으셨나요?
                    </button>
                    <div className="flex gap-4 text-sm mt-2">
                        <button
                            type="button"
                            className="text-gray-500 hover:text-gray-800 transition-colors"
                            onClick={() => router.push('/')}
                        >
                            홈으로 돌아가기
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                            type="button"
                            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                            onClick={() => router.push('/sign-up')}
                        >
                            회원가입
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
